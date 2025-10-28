import { userRoutes } from './user.routes';
import { buildDocsFromRoutes } from '../../utils/docs';

export const userDocs = buildDocsFromRoutes(userRoutes);
  
