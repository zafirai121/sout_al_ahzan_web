// Puts every track still without a reciter page onto one, making the pages
// of reciters new to the library (functions/api/link-reciter.js): for the
// tracks added by apps that don't ask for it themselves. Run by
// .github/workflows/thumbs.yml; needs a GitHub Actions OpenID Connect token
// (id-token: write).

const SITE = 'https://web.soutalahzan.com';
const AUDIENCE = 'soutalahzan-thumbs';

async function bearer() {
  const { ACTIONS_ID_TOKEN_REQUEST_URL: url, ACTIONS_ID_TOKEN_REQUEST_TOKEN: auth } = process.env;
  if (!url || !auth) throw new Error('no GitHub OIDC token (id-token: write needed)');
  const res = await fetch(`${url}&audience=${AUDIENCE}`, { headers: { authorization: `bearer ${auth}` } });
  if (!res.ok) throw new Error(`OIDC token: ${res.status}`);
  return (await res.json()).value;
}

for (let attempt = 1; ; attempt++) {
  const res = await fetch(`${SITE}/api/link-reciter`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await bearer()}`, 'content-type': 'application/json' },
    body: '{}',
  });
  // Run on the push that adds it: the site may still be publishing it
  if ((res.status === 404 || res.status === 405) && attempt < 10) {
    console.log(`not on the site yet (${res.status}), trying again in 30 s`);
    await new Promise((r) => setTimeout(r, 30_000));
    continue;
  }
  const text = await res.text();
  if (!res.ok) throw new Error(`link-reciter: ${res.status} ${text}`);
  const { reciters } = JSON.parse(text);
  for (const r of reciters) {
    console.log(`${r.created ? 'new page' : 'page'} ${r.id} ${r.name}: ${r.moved.length} of ${r.tracks.length} tracks put on it`);
  }
  if (!reciters.length) console.log('every track is on its reciter page');
  break;
}
