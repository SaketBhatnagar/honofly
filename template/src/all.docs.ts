import { userDocs } from './modules/users/user.docs.js';
import { mergeDocsRecords } from './utils/docs.js';

export const allDocs = mergeDocsRecords(userDocs);
