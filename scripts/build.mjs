// `npm run build`: next build, without --use-openssl-ca in NODE_OPTIONS.
// Cloudflare Pages' builder sets it, and Node refuses it in the worker threads
// next build starts at once ("Initiated Worker with invalid NODE_OPTIONS env
// variable: --use-openssl-ca is not allowed"), so every build failed from
// 2026-10-26. Without it Node trusts its own list of certificates, as it does
// anywhere the option is not set. Any other option is passed on as it was.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const options = (process.env.NODE_OPTIONS || '').split(/\s+/).filter((o) => o && o !== '--use-openssl-ca');
const env = { ...process.env, NODE_OPTIONS: options.join(' ') };
if (!options.length) delete env.NODE_OPTIONS;

const next = createRequire(import.meta.url).resolve('next/dist/bin/next');
const { status, error } = spawnSync(process.execPath, [next, 'build', ...process.argv.slice(2)], { stdio: 'inherit', env });
if (error) throw error;
process.exit(status ?? 1);
