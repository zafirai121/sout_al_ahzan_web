"use client";

// Cloudflare Turnstile, the check that a person is signing in, not a program.
// Unseen while nothing is suspicious ("interaction-only"); [shown] draws its
// box (after five wrong passwords). The token it gives works once: [round]
// changing asks for a new one.
import React, { useEffect, useRef } from 'react';
import { TURNSTILE_SITE_KEY } from '@/lib/login';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((done, fail) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? done(window.turnstile) : fail(new Error('turnstile')));
    s.onerror = () => { loading = null; fail(new Error('turnstile')); };
    document.head.appendChild(s);
  });
  return loading;
}

export default function Turnstile({ shown, round, onToken }: { shown: boolean; round: number; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const said = useRef(onToken);
  useEffect(() => { said.current = onToken; });

  useEffect(() => {
    let live = true;
    loadTurnstile().then(api => {
      if (!live || !box.current) return;
      widget.current = api.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        language: 'ar',
        theme: 'dark',
        appearance: shown ? 'always' : 'interaction-only',
        callback: (token: string) => said.current(token),
        'expired-callback': () => said.current(''),
        'error-callback': () => said.current(''),
      });
    }).catch(() => said.current(''));
    return () => {
      live = false;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [shown]);

  // A token is spent with each try: a fresh one for the next
  useEffect(() => {
    if (round > 0 && widget.current) {
      said.current('');
      window.turnstile?.reset(widget.current);
    }
  }, [round]);

  return <div ref={box} className={`auth-turnstile${shown ? ' is-shown' : ''}`} />;
}
