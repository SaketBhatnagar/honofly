#!/usr/bin/env node

import { access, cp, mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";
import process, { stdin as input, stdout as output } from "process";
import { fileURLToPath } from "url";
import readline from "readline/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = path.resolve(__dirname, "..", "template");
const FRAMEWORK_TEMPLATE_ROOT = path.join(TEMPLATE_ROOT, "frameworks");
const DEFAULT_APP_NAME = "honofly-app";
const DEFAULT_FRAMEWORK = "hono";

const BASE_DEPENDENCIES = {
  jose: "^6.0.8",
  pino: "^9.6.0",
  "pino-http": "^10.3.2",
  zod: "^3.23.8",
};

const BASE_DEV_DEPENDENCIES = {
  "@types/node": "^22.13.1",
  typescript: "^5.5.2",
  vitest: "2.1.8",
};

const BASE_SCRIPTS = {
  test: "vitest",
};

const FRAMEWORK_CONFIGS = {
  hono: {
    displayName: "Hono",
    runtime: "workers",
    dependencies: {
      hono: "^4.7.0",
    },
    devDependencies: {
      "@cloudflare/vitest-pool-workers": "^0.6.4",
      "@cloudflare/workers-types": "^4.20250204.0",
      wrangler: "^4.0.0",
    },
    scripts: {
      deploy: "wrangler deploy",
      dev: "wrangler dev",
      start: "wrangler dev",
      "cf-typegen": "wrangler types",
    },
    requiresEnvFile: false,
  },
  express: {
    displayName: "Express",
    runtime: "node",
    dependencies: {
      express: "^4.19.2",
    },
    devDependencies: {
      "@types/express": "^4.17.21",
      tsx: "^4.7.0",
    },
    scripts: {
      dev: "tsx watch --env-file=.env src/index.ts",
      start: "tsx --env-file=.env src/index.ts",
      build: "tsc",
    },
    requiresEnvFile: true,
  },
  fastify: {
    displayName: "Fastify",
    runtime: "node",
    dependencies: {
      fastify: "^4.28.1",
    },
    devDependencies: {
      tsx: "^4.7.0",
    },
    scripts: {
      dev: "tsx watch --env-file=.env src/index.ts",
      start: "tsx --env-file=.env src/index.ts",
      build: "tsc",
    },
    requiresEnvFile: true,
  },
};

function parseArguments(argv) {
  const args = argv.slice(2);
  let projectName;
  let framework;
  const extras = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--framework" || arg === "-f") {
      const candidate = args[index + 1];

      if (!candidate || candidate.startsWith("-")) {
        throw new Error('Flag "--framework" expects a value. Example: --framework hono');
      }

      framework = candidate.toLowerCase();
      index += 1;
      continue;
    }

    if (!projectName) {
      projectName = arg;
      continue;
    }

    extras.push(arg);
  }

  return { projectName, framework, extras };
}

function toValidPackageName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-~]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/-+$/, "");
}

function sortObjectKeys(record) {
  return Object.keys(record)
    .sort()
    .reduce((acc, key) => {
      acc[key] = record[key];
      return acc;
    }, {});
}

function formatSupportedList() {
  const supported = Object.keys(FRAMEWORK_CONFIGS);
  return supported.map((value) => `"${value}"`).join(" | ") || "none";
}

function assertFrameworkSupported(candidate) {
  const normalized = (candidate || DEFAULT_FRAMEWORK).toLowerCase();
  const config = FRAMEWORK_CONFIGS[normalized];

  if (!config) {
    throw new Error(
      `Unsupported framework "${candidate}". Supported frameworks: ${formatSupportedList()}.`,
    );
  }

  return { key: normalized, config };
}

async function ensureEmptyDirectory(dir) {
  try {
    await access(dir, fsConstants.F_OK);
  } catch {
    await mkdir(dir, { recursive: true });
    return;
  }

  const existing = await readdir(dir);
  if (existing.length > 0) {
    throw new Error(
      `Target directory "${dir}" is not empty. Pick a different project name or start from an empty folder.`,
    );
  }
}

async function updatePackageJson(targetDir, projectName, frameworkKey, frameworkConfig) {
  const packageJsonPath = path.join(targetDir, "package.json");
  let packageJson;

  try {
    packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read template package.json: ${error.message}`);
  }

  packageJson.name = toValidPackageName(projectName);
  packageJson.dependencies = sortObjectKeys({
    ...BASE_DEPENDENCIES,
    ...frameworkConfig.dependencies,
  });
  packageJson.devDependencies = sortObjectKeys({
    ...BASE_DEV_DEPENDENCIES,
    ...frameworkConfig.devDependencies,
  });
  packageJson.scripts = sortObjectKeys({
    ...BASE_SCRIPTS,
    ...frameworkConfig.scripts,
  });
  packageJson.honofly = {
    framework: frameworkKey,
  };
  if (frameworkConfig.runtime === "node") {
    packageJson.type = "module";
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
}

async function removePathIfExists(targetPath, rmOptions = {}) {
  try {
    await rm(targetPath, { force: true, ...rmOptions });
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function removeFrameworkArtifacts(targetDir, frameworkKey) {
  if (frameworkKey !== "hono") {
    await removePathIfExists(path.join(targetDir, "src", "framework", "hono.server.ts"));
  }
}

async function cleanScaffoldArtifacts(targetDir) {
  await Promise.all([
    removePathIfExists(path.join(targetDir, "node_modules"), { recursive: true }),
    removePathIfExists(path.join(targetDir, "package-lock.json")),
    removePathIfExists(path.join(targetDir, "template", "package-lock.json")),
    removePathIfExists(path.join(targetDir, "frameworks"), { recursive: true }),
    removePathIfExists(path.join(targetDir, "template"), { recursive: true }),
  ]);
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectoryContents(sourceDir, destinationDir) {
  await mkdir(destinationDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(destinationDir, entry.name);

      if (entry.isDirectory()) {
        await copyDirectoryContents(sourcePath, targetPath);
        return;
      }

      await mkdir(path.dirname(targetPath), { recursive: true });
      await cp(sourcePath, targetPath, { force: true });
    }),
  );
}

async function copyFile(sourcePath, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { force: true });
}

async function applyFrameworkTemplate(targetDir, frameworkKey) {
  const overlayRoot = path.join(FRAMEWORK_TEMPLATE_ROOT, frameworkKey);

  if (!(await pathExists(overlayRoot))) {
    return;
  }

  const overlaySrcDir = path.join(overlayRoot, "src");
  if (await pathExists(overlaySrcDir)) {
    const targetSrcDir = path.join(targetDir, "src");
    const targetFrameworkDir = path.join(targetSrcDir, "frameworks", "current");
    await removePathIfExists(targetFrameworkDir, { recursive: true });
    await copyDirectoryContents(overlaySrcDir, targetSrcDir);
  }

  const overlayTsconfig = path.join(overlayRoot, "tsconfig.json");
  if (await pathExists(overlayTsconfig)) {
    await copyFile(overlayTsconfig, path.join(targetDir, "tsconfig.json"));
  }
}

async function removeWorkersArtifacts(targetDir) {
  await Promise.all([
    removePathIfExists(path.join(targetDir, "wrangler.json")),
    removePathIfExists(path.join(targetDir, "wrangler.toml")),
    removePathIfExists(path.join(targetDir, "worker-configuration.d.ts")),
  ]);
}

async function ensureEnvFile(targetDir, frameworkKey, frameworkConfig) {
  if (!frameworkConfig.requiresEnvFile) {
    return;
  }

  const envPath = path.join(targetDir, ".env");

  try {
    await access(envPath, fsConstants.F_OK);
    return;
  } catch {
    // File does not exist; fall through and create it.
  }

  const content = `# Honofly environment defaults\nFRAMEWORK=${frameworkKey}\nPORT=3000\n`;
  await writeFile(envPath, content, "utf8");
}

async function promptForName(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  await rl.close();
  return answer;
}

async function main() {
  try {
    const { projectName: projectNameArg, framework: frameworkArg, extras } = parseArguments(process.argv);

    if (extras.length > 0) {
      throw new Error(`Unknown arguments: ${extras.join(" ")}`);
    }

    let projectName = projectNameArg;

    if (!projectNameArg) {
      if (process.stdin.isTTY) {
        projectName = (await promptForName(`Project name (${DEFAULT_APP_NAME}): `)).trim();
      }
      projectName = projectName || DEFAULT_APP_NAME;
    }

    const { key: selectedFramework, config: frameworkConfig } = assertFrameworkSupported(
      frameworkArg || DEFAULT_FRAMEWORK,
    );

    const useCurrentDirectory = [".", "./"].includes(projectName);
    const resolvedProjectName = useCurrentDirectory
      ? path.basename(process.cwd()) || DEFAULT_APP_NAME
      : projectName;
    const targetDir = useCurrentDirectory ? process.cwd() : path.resolve(process.cwd(), projectName);

    await ensureEmptyDirectory(targetDir);

    await cp(TEMPLATE_ROOT, targetDir, { recursive: true });
    await cleanScaffoldArtifacts(targetDir);
    await applyFrameworkTemplate(targetDir, selectedFramework);
    await removeFrameworkArtifacts(targetDir, selectedFramework);
    if (frameworkConfig.runtime !== "workers") {
      await removeWorkersArtifacts(targetDir);
    }
    await updatePackageJson(targetDir, resolvedProjectName, selectedFramework, frameworkConfig);
    await ensureEnvFile(targetDir, selectedFramework, frameworkConfig);

    console.log(`\nSuccess! Created Honofly project in ${targetDir}`);
    console.log(`Framework: ${frameworkConfig.displayName} (${selectedFramework})`);
    console.log("\nNext steps:");
    if (!useCurrentDirectory) {
      console.log(`  cd ${projectName}`);
    }
    console.log("  npm install");
    console.log("  npm run dev\n");
    console.log("Happy coding with Honofly!");
  } catch (error) {
    console.error(`\nFailed to scaffold Honofly project: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
