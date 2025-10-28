import { env } from '../config/env';
import { Framework, HttpContext, ResponseHelpers } from '../types/http.types';

export function getHonoFlyContext(...params: any[]): HttpContext {
  const [c, next] = params;
  const framework: Framework = env.framework;

  const responseHelpers: ResponseHelpers = {
    json: (data, status) => c.json(data as any, status as any),
    text: (data, status) => c.text(data as any, status as any),
    html: (data, status) => c.html(data as any, status as any),
    blob: (data, status) => c.blob(data as any, status as any),
    stream: (data, status) => c.stream(data as any, status as any),
    status: (code) => {
      c.status(code as any);
      return responseHelpers;
    },
    header: (key, value) => {
      c.header(key, value);
      return responseHelpers;
    },
    redirect: (url, status) => c.redirect(url, status as any),
    send: (body, status) => {
      if (
        typeof body === 'string' ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body) ||
        typeof (body as any)?.pipe === 'function'
      ) {
        return c.body(body as any, status as any);
      }

      return c.json(body as any, status as any);
    },
  };

  const toRecord = (headers: Headers) => Object.fromEntries(headers.entries());

  return {
    framework,
    req: {
      params: c.req.param(),
      query: c.req.query(),
      body: async () => c.req.json(),
      headers: toRecord(c.req.raw.headers),
      method: c.req.method,
      path: c.req.path,
    },
    res: responseHelpers,
    next: typeof next === 'function' ? async () => next() : async () => undefined,
    get: c.get.bind(c),
    set: c.set.bind(c),
  };
}
