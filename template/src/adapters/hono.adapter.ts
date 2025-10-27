import { HttpContext } from '../types/http.types';

export function getHonoFlyContext(...params:any): HttpContext {
    
    const [c,next] = params;
    return {
        req: {
            params: c.req.param(),
            query: c.req.query(),
            body: async () => c.req.json(),
            headers: c.req.header(),
            method: c.req.method,
            path: c.req.path,
            
        },
        res: {
            json: (data, status) => c.json(data as any, status as any),
            text: (data, status) => c.text(data as any, status as any),
            html: (data, status) => c.html(data as any, status as any),
            blob: (data, status) => c.blob(data as any, status as any),
            stream: (data, status) => c.stream(data as any, status as any),
            status: (code) => c.status(code as any),
            header: (key, value) => c.header(key, value),
            redirect: (url) => c.redirect(url)
        },
        next: next || (()=>{}),
        get: c.get.bind(c),
        set: c.set.bind(c)

    };
} 
