import { UserOpenAPISchema, CreateUserOpenAPISchema, UpdateUserOpenAPISchema } from './user.dto';

export const userDocs = {
    "/users": {
        get: {
            tags: ["users"],
            summary: "Get all users",
            security: [{ BearerAuth: [] }],
            responses: {
                "200": {
                    description: "List of users",
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: UserOpenAPISchema
                            }
                        }
                    }
                },
                "403": { description: "Access Denied" },
            },
        },
        post: {
            tags: ["users"],
            summary: "Create a new user",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: CreateUserOpenAPISchema
                    }
                }
            },
            responses: {
                "201": { description: "User created successfully" },
                "400": { description: "Invalid request body" }
            }
        }
    },
    "/users/{id}": {
        get: {
            tags: ["users"],
            summary: "Get user by ID",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            responses: {
                "200": { description: "User details" },
                "404": { description: "User not found" }
            }
        },
        put: {
            tags: ["users"],
            summary: "Update user info",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: UpdateUserOpenAPISchema
                    }
                }
            },
            responses: {
                "200": { description: "User updated successfully" },
                "404": { description: "User not found" },
                "400": { description: "Invalid request body" }
            }
        },
        delete: {
            tags: ["users"],
                summary: "Delete user",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            responses: {
                "200": { description: "User deleted successfully" },
                "404": { description: "User not found" }
            }
        }
    }
};
  