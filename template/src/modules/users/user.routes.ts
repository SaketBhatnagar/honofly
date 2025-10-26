import { UserController } from './user.controller';
import { getHonoFlyContext } from '../../adapters/hono.adapter';
import { honoAuthMiddleware } from '../../middlewares/auth.middleware';
import { ROUTE } from '../../constants/routes-endpoints';

const instance = new UserController();

export const userRoutes : ROUTE[] = [
	{
		method: 'GET',
		path: '/users',
		controller: {
			instance,
			method: 'listUsers'
		},
		middlewares: [honoAuthMiddleware],
	},
	{
		method: 'GET',
		path: '/users/:id',
		controller: {
			instance,
			method: 'getUser'
		},
		middlewares: [],
	},
	{
		method: 'PUT',
		path: '/users/:id',
		controller: {
			instance,
			method: 'updateUser'
		},
		middlewares: [], 
	},
	{
		method: 'POST',
		path: '/users',
		controller: {
			instance,
			method: 'createUser'
		},
		middlewares: [],
	},
	{
		method: 'DELETE',
		path: '/users/:id',
		controller: {
			instance,
			method: 'deleteUser'
		},
		middlewares: [],
	},
];
