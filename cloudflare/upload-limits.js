// How much one account may upload in a day (functions/api/upload.js): sign-up
// needs no confirmed e-mail, so without a limit anyone could fill the bucket
// from made-up accounts. The site's owner (the admin role) has none.

/** Files of each kind an account may upload in 24 hours. */
export const PER_DAY = { audio: 30, image: 60 };
const DAY = 24 * 60 * 60 * 1000;

/**
 * Whether [userId] has uploaded PER_DAY[kind] files of [kind] in the last 24
 * hours. Their keys carry the time they came (user_uploads/<id>/<kind>_<ms>_…),
 * so the bucket lists just those after a day ago.
 */
export async function overDailyLimit(r2, userId, kind, now = Date.now()) {
  const most = PER_DAY[kind];
  if (!most) return false;
  const prefix = `user_uploads/${userId}/${kind}_`;
  const listed = await r2.list({ prefix, startAfter: `${prefix}${now - DAY}`, limit: most });
  return listed.objects.length >= most;
}
