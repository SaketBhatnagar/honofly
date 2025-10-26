import { allDocs } from '../all.docs';

export const openAPIConfig = {
	openapi: '3.0.0',
	info: {
		title: 'User Management API',
		version: '1.0.0',
		description: 'Auto-generated OpenAPI docs',
	},
	paths: {
		...allDocs,
	},
};
