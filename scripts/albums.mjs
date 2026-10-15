// A reciter's albums (releases) from shiavoice.com's lists, matched to the
// library's tracks (run by .github/workflows/library.yml):
//
//   albums-probe  shows the pages named (FILES, | between; shiavoice.com only)
//                 as they are made: their title, links and the site's rules
//                 for robots, so the reading can be written to them
//
// Only the lists are read (names of releases and of their tracks), slowly,
// never the audio.
const MODE = process.env.MODE || 'albums-probe';
const FILES = (process.env.FILES || '').split(/[|\n]/).map((s) => s.trim()).filter(Boolean);
const UA = 'SawtAlahzanLibrary/1.0 (+https://soutalahzan.com)';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } });
  return { status: res.status, html: await res.text() };
}
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

if (MODE === 'albums-probe') {
  const robots = await page('https://shiavoice.com/robots.txt').catch((e) => ({ status: 0, html: String(e) }));
  console.log(`## robots.txt (${robots.status})\n${robots.html.slice(0, 1500)}`);
  for (const url of FILES) {
    if (!/^https:\/\/(www\.)?shiavoice\.com\//.test(url)) { console.log(`\n## ${url}: not shiavoice.com, left`); continue; }
    await pause(1500);
    const { status, html } = await page(url);
    console.log(`\n## ${url} (${status}, ${html.length} bytes)`);
    console.log(`title: ${text((/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '')}`);
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(([, href, inner]) => [href, text(inner)]).filter(([href, t]) => t && /cat-|play-|page|p=|@/.test(href));
    console.log(`links (${links.length}):`);
    for (const [href, t] of links.slice(0, 120)) console.log(`- ${href} | ${t.slice(0, 90)}`);
    // Lengths written as m:ss near the tracks
    const times = [...html.matchAll(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g)].length;
    console.log(`times on the page: ${times}`);
    // The markup around the first link to another list, and around the pages' numbers
    const sub = html.search(/href="\/cat-(?!70")\d+"/);
    if (sub > 0) console.log(`around the first list link:\n${html.slice(Math.max(0, sub - 900), sub + 500)}`);
    const pages = html.search(/\/page-2"/);
    if (pages > 0) console.log(`around the pages:\n${html.slice(Math.max(0, pages - 400), pages + 300)}`);
    // A piece of the markup around the first track link, to see how a track is written
    const at = html.search(/href="[^"]*play-/);
    if (at > 0) console.log(`around the first track:\n${html.slice(Math.max(0, at - 600), at + 900)}`);
  }
}
