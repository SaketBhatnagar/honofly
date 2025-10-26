#!/usr/bin/env node

import { access, cp, mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = path.resolve(__dirname, '..', 'template');
const DEFAULT_APP_NAME = 'honofly-app';

async function ensureEmptyDirectory(dir) {
  try {
    await access(dir, fsConstants.F_OK);
  } catch {
    await mkdir(dir, { recursive: true });
    return;
  }

  const existing = await readdir(dir);
  if (existing.length > 0) {
    throw new Error(`Target directory "${dir}" is not empty. Pick a different project name or start from an empty folder.`);
  }
}

function toValidPackageName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/-+$/, '');
}

async function updatePackageJson(targetDir, projectName) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  let packageJson;

  try {
    packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read template package.json: ${error.message}`);
  }

  packageJson.name = toValidPackageName(projectName);
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
}

async function promptForName(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  await rl.close();
  return answer;
}

async function main() {
  try {
    let projectNameArg = process.argv[2];
    let projectName = projectNameArg;

    if (!projectNameArg) {
      if (process.stdin.isTTY) {
        projectName = (await promptForName(`Project name (${DEFAULT_APP_NAME}): `)).trim();
      }
      projectName = projectName || DEFAULT_APP_NAME;
    }

    const useCurrentDirectory = ['.', './'].includes(projectName);
    const resolvedProjectName = useCurrentDirectory ? path.basename(process.cwd()) || DEFAULT_APP_NAME : projectName;
    const targetDir = useCurrentDirectory ? process.cwd() : path.resolve(process.cwd(), projectName);

    await ensureEmptyDirectory(targetDir);

    await cp(TEMPLATE_ROOT, targetDir, { recursive: true });
    await updatePackageJson(targetDir, resolvedProjectName);

    console.log(`\nSuccess! Created Honofly project in ${targetDir}`);
    console.log('\nNext steps:');
    if (!useCurrentDirectory) {
      console.log(`  cd ${projectName}`);
    }
    console.log('  npm install');
    console.log('  npm run dev\n');
    console.log('Happy coding with Honofly!');
  } catch (error) {
    console.error(`\nFailed to scaffold Honofly project: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
