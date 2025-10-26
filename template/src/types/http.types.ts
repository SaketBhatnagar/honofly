export interface HttpRequest {
    params: Record<string, string>;
    query: Record<string, string>;
    body: () => Promise<unknown>;
    headers: Record<string, string>;
    method: string;
    path: string;
}

export interface HttpResponse {
    json: (data: unknown, status?: number) => any;
    status: (code: number) => any;
    header: (key: string, value: string) => any;
    redirect: (url: string) => any;
    text: (data: unknown, status?: number) => any;
    html: (data: unknown, status?: number) => any;
    blob: (data: unknown, status?: number) => any;
    stream: (data: unknown, status?: number) => any;
}

export interface HttpContext {
    req: HttpRequest;
    res: HttpResponse;
    next?: any;
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
} 