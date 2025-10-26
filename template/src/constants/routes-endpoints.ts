export type ROUTES_ENDPOINTS = 'GET' | 'POST' | 'PUT' | 'DELETE';


export type ROUTE = {
    method: ROUTES_ENDPOINTS;
    path: string;
    middlewares: any[];
    controller: {
        instance: any;
        method: string;
    };
}

// export const ROUTES_ENDPOINTS: ROUTES_ENDPOINTS[] = ['get', 'post', 'put', 'delete'];