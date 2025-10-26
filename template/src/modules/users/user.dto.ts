import { z } from 'zod';

// Base Zod schema definition
export const UserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	password: z.string(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export const CreateUserSchema = UserSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Types derived from Zod schemas
export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// OpenAPI schemas
export const UserOpenAPISchema = {
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		email: { type: "string" },
		password: { type: "string" },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" }
	}
} as const;

export const CreateUserOpenAPISchema = {
	type: "object",
	required: ["name", "email", "password"] as const,
	properties: {
		name: { type: "string" },
		email: { type: "string" },
		password: { type: "string" }
	}
} as const;

export const UpdateUserOpenAPISchema = {
	type: "object",
	properties: {
		name: { type: "string" },
		email: { type: "string" },
		password: { type: "string" }
	}
} as const;