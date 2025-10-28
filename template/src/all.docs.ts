import { userDocs } from './modules/users/user.docs';
import { mergeDocsRecords } from './utils/docs';

export const allDocs = mergeDocsRecords(userDocs);
