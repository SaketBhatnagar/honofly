import { userRoutes } from './user.routes.js';
import { buildDocsFromRoutes } from '../../utils/docs.js';

export const userDocs = buildDocsFromRoutes(userRoutes);
  
