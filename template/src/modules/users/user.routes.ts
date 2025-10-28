import { UserController } from './user.controller';
import { honoAuthMiddleware } from '../../middlewares/auth.middleware';
import type { ROUTE } from '../../constants/routes-endpoints';
import { controller, defineRoutes, route } from '../../utils/controller';
import { UserOpenAPISchema, CreateUserOpenAPISchema, UpdateUserOpenAPISchema } from './user.dto';


const userController = controller(new UserController());

export const userRoutes: ROUTE[] = defineRoutes([
    route({
        method: 'GET',
        path: '/users',
        controller: userController.listUsers,
        middlewares: [honoAuthMiddleware],
        docs: {
			tags: ['users'],
			summary: 'Get all users',
			security: [{ BearerAuth: [] }],
			responses: {
				'200': {
					description: 'List of users',
					content: {
						'application/json': {
							schema: {
								type: 'array',
								items: UserOpenAPISchema,
							},
						},
					},
				},
				'403': { description: 'Access Denied' },
			},
        },
    }),
    route({
        method: 'GET',
        path: '/users/:id',
        controller: userController.getUser,
        middlewares: [],
        docs: {
			tags: ['users'],
			summary: 'Get user by ID',
			parameters: [
				{
					name: 'id',
					in: 'path',
					required: true,
					schema: { type: 'string' },
				},
			],
			responses: {
				'200': { description: 'User details' },
				'404': { description: 'User not found' },
			},
        },
    }),
    route({
        method: 'PUT',
        path: '/users/:id',
        controller: userController.updateUser,
        middlewares: [], 
        docs: {
			tags: ['users'],
			summary: 'Update user info',
			parameters: [
				{
					name: 'id',
					in: 'path',
					required: true,
					schema: { type: 'string' },
				},
			],
			requestBody: {
				content: {
					'application/json': {
						schema: UpdateUserOpenAPISchema,
					},
				},
			},
			responses: {
				'200': { description: 'User updated successfully' },
				'404': { description: 'User not found' },
				'400': { description: 'Invalid request body' },
			},
        },
    }),
    route({
        method: 'POST',
        path: '/users',
        controller: userController.createUser,
        middlewares: [],
        docs: {
			tags: ['users'],
			summary: 'Create a new user',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: CreateUserOpenAPISchema,

					},
				},
			},
			responses: {
				'201': { description: 'User created successfully' },
				'400': { description: 'Invalid request body' },

			},
        },
    }),
    route({
        method: 'DELETE',
        path: '/users/:id',
        controller: userController.deleteUser,
        middlewares: [],
        docs: {
			tags: ['users'],
			summary: 'Delete user',
			parameters: [
				{
					name: 'id',
					in: 'path',
					required: true,
					schema: { type: 'string' },
				},
			],
			responses: {
				'200': { description: 'User deleted successfully' },
				'404': { description: 'User not found' },
			},
        },
    }),
]);
