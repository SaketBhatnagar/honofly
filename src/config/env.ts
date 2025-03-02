
interface Env {
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_ALGORITHM: string;
    JWT_ISSUER: string;
    JWT_AUDIENCE: string;
    framework: "hono" | "express" | "fastify";
}

const env: Env = {
    PORT: 3000,
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
    JWT_SECRET: 'secret',
    JWT_EXPIRES_IN: '1h',
    JWT_ALGORITHM: 'HS256',
    JWT_ISSUER: 'auth',
    JWT_AUDIENCE: 'api',
    framework: "hono"
}

export default env;
export {env};