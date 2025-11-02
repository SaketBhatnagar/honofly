export type Framework = "hono" | "express" | "fastify";

// Alias keeps status typing consistent across frameworks without pulling in their enums.
export type HttpStatusCode = number;

type RecordOf<T> = Record<string, T>;

export interface HttpRequest {
  params: RecordOf<string>;
  query: RecordOf<string | string[]>;
  headers: RecordOf<string>;
  method: string;
  path: string;
  body<T = unknown>(): Promise<T>;
}

export interface ResponseHelpers {
  json<T = unknown>(data: T, status?: number): Promise<unknown> | unknown;
  text(data: string, status?: number): Promise<unknown> | unknown;
  html(data: string, status?: number): Promise<unknown> | unknown;
  blob(data: unknown, status?: number): Promise<unknown> | unknown;
  stream(data: unknown, status?: number): Promise<unknown> | unknown;
  status(code: number): ResponseHelpers;
  header(name: string, value: string): ResponseHelpers;
  redirect(url: string, status?: number): Promise<unknown> | unknown;
  send(body: unknown, status?: number): Promise<unknown> | unknown;
}

export interface HttpContext {
  framework: Framework;
  req: HttpRequest;
  res: ResponseHelpers;
  next: () => Promise<unknown>;
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): void;
}

export type HandlerResult = unknown;

export type Handler = (context: HttpContext) => Promise<HandlerResult>;

export type Middleware = (context: HttpContext) => Promise<HandlerResult>;
