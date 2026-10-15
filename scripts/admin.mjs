// The site's admin (run by .github/workflows/library.yml): FILES is the SHA-256
// of the account's e-mail (trimmed, lower case), never the e-mail itself, as the
// workflow's log is public.
//   admin-plan   says whether there is such an account, confirmed, its uploads,
//                and how many admins there are
//   admin        gives it the admin role (app_metadata.role), which lets it edit
//                and delete any track through the site's endpoints
import { call } from './upkeep.mjs';

const MODE = process.env.MODE || 'admin-plan';
const sha = (process.env.FILES || '').trim().toLowerCase();
if (!/^[0-9a-f]{64}$/.test(sha)) throw new Error('FILES: the SHA-256 of the e-mail, 64 hex digits');
const res = await call({ action: 'admin-role', email_sha256: sha, apply: MODE === 'admin' });
console.log(JSON.stringify(res, null, 1));
