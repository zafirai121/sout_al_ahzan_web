"use client";

// The listener's own pages (account, profile, settings): the info pages'
// header with a picture beside it, panels below. What a visitor who has not
// signed in sees says so, rather than a made-up user.

import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { UserRound } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import '@/components/info/info.css';
import './me.css';

/** The name to call them by: the one they gave, else their address's first part */
export function nameOf(user: User): string {
  const meta = user.user_metadata ?? {};
  return (meta.full_name || meta.name || user.email?.split('@')[0] || '').trim();
}

export function MePage({ children }: { children: React.ReactNode }) {
  return <div className="content-inner me-page">{children}</div>;
}

/** The header: their picture (or initial), their name, a line, and what to do next. */
export function MeHead({ user, title, line, children }: {
  user: User | null;
  title: string;
  line?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initial = user ? nameOf(user).charAt(0) : '';
  return (
    <header className="info-hero me-head">
      <span className="info-hero-ornament" aria-hidden="true" />
      <span className={`me-avatar${user ? '' : ' is-visitor'}`} aria-hidden="true">
        {avatar
          ? <img src={avatar} alt="" referrerPolicy="no-referrer" />
          : initial || <UserRound size={52} strokeWidth={1.6} />}
      </span>
      <div className="me-head-text">
        <h1 className="me-name">{title}</h1>
        {line ? <div className="me-line">{line}</div> : null}
        {children ? <div className="me-head-actions">{children}</div> : null}
      </div>
    </header>
  );
}

/** Sign in and make an account: the two buttons, opening the sign-in window. */
export function SignInButtons({ small = false }: { small?: boolean }) {
  const [open, setOpen] = useState<null | 'login' | 'signup'>(null);
  return (
    <>
      <button type="button" className={`btn-gold${small ? ' me-btn-small' : ''}`} onClick={() => setOpen('login')}>تسجيل الدخول</button>
      <button type="button" className={`btn-outline${small ? ' me-btn-small' : ''}`} onClick={() => setOpen('signup')}>إنشاء حساب</button>
      {open ? <AuthModal initialIsLogin={open === 'login'} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

/** A panel: a title, a few words, then its rows or buttons. */
export function MePanel({ title, text, children, id }: {
  title: string;
  text?: React.ReactNode;
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="me-panel" aria-labelledby={id}>
      <h2 className="me-panel-title" id={id}>{title}</h2>
      {text ? <p className="me-panel-text">{text}</p> : null}
      {children}
    </section>
  );
}

/** A label and its value, one row of a panel's list */
export function MeRow({ label, children, ltr = false }: { label: string; children: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="me-row">
      <dt>{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined}>{children}</dd>
    </div>
  );
}
