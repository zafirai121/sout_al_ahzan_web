"use client";

// The pages the footer leads to (about, contact, help, the legal pages...):
// one header, cards, forms and the legal layout, so they read as one site.

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader } from 'lucide-react';
import { ContactKind, sendContactMessage, SEND_ERROR } from '@/utils/contact';
import './info.css';

/** The page's header: who it is for (when that matters), its title and what it is about. */
export function InfoHero({ kicker, title, lead, children }: {
  kicker?: string;
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="info-hero">
      <span className="info-hero-ornament" aria-hidden="true" />
      {kicker ? <p className="info-kicker">{kicker}</p> : null}
      <h1 className="info-title">{title}</h1>
      {lead ? <p className="info-lead">{lead}</p> : null}
      {children ? <div className="info-hero-extra">{children}</div> : null}
    </header>
  );
}

export function InfoPage({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`content-inner info-page${wide ? ' info-page--wide' : ''}`}>{children}</div>;
}

/** A card: an icon in gold, a title, a few words; a link makes all of it one. */
export function InfoCard({ icon, title, children, href, action }: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  href?: string;
  /** What the link says, shown at the card's foot */
  action?: string;
}) {
  const body = (
    <>
      {icon ? <span className="info-card-icon" aria-hidden="true">{icon}</span> : null}
      <h2 className="info-card-title">{title}</h2>
      {children ? <div className="info-card-text">{children}</div> : null}
      {action ? <span className="info-card-action">{action}</span> : null}
    </>
  );
  return href
    ? <Link href={href} prefetch={false} className="info-card info-card--link">{body}</Link>
    : <div className="info-card">{body}</div>;
}

export function InfoSection({ title, children, id }: { title?: string; children: React.ReactNode; id?: string }) {
  return (
    <section className="info-section" id={id}>
      {title ? <h2 className="info-section-title">{title}</h2> : null}
      {children}
    </section>
  );
}

/** The closing band: one line and the next step. */
export function InfoCta({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="info-cta">
      <p className="info-cta-title">{title}</p>
      <div className="info-cta-actions">{children}</div>
    </div>
  );
}

type Field = 'subject' | 'message' | 'url';

/**
 * A message to the site's owner (functions/api/contact.js keeps it): name and
 * email, then a subject, a message or a link, each with its own label.
 */
export function MessageForm({
  kind, title, nameLabel = 'الاسم الكامل', emailLabel = 'البريد الإلكتروني', fields = ['message'],
  labels = {}, required = ['message'], subject, submitLabel = 'إرسال الرسالة', sentText,
}: {
  kind: ContactKind;
  title?: string;
  nameLabel?: string;
  emailLabel?: string;
  fields?: Field[];
  labels?: Partial<Record<Field, string>>;
  required?: Field[];
  /** A fixed subject (the job applied for) */
  subject?: string;
  submitLabel?: string;
  sentText: string;
}) {
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '', url: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues(v => ({ ...v, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!values.email.includes('@')) return setError('اكتب بريداً إلكترونياً صحيحاً.');
    setSending(true);
    try {
      await sendContactMessage({
        kind,
        name: values.name,
        email: values.email,
        subject: subject ?? (values.subject || undefined),
        message: fields.includes('url') ? values.url : values.message,
      });
      setSent(true);
    } catch {
      setError(SEND_ERROR);
    } finally {
      setSending(false);
    }
  };

  if (sent) return <p className="info-sent" role="status">{sentText}</p>;

  const id = `form-${kind}`;
  return (
    <form className="info-form" onSubmit={submit} aria-labelledby={title ? `${id}-title` : undefined}>
      {title ? <h2 id={`${id}-title`} className="info-form-title">{title}</h2> : null}
      {error ? <p className="info-error" role="alert">{error}</p> : null}
      <div className="info-row">
        <label className="info-field">
          <span>{nameLabel}</span>
          <input type="text" required value={values.name} onChange={set('name')} disabled={sending} autoComplete="name" />
        </label>
        <label className="info-field">
          <span>{emailLabel}</span>
          <input type="email" required value={values.email} onChange={set('email')} disabled={sending} autoComplete="email" dir="ltr" />
        </label>
      </div>
      {fields.includes('subject') ? (
        <label className="info-field">
          <span>{labels.subject ?? 'الموضوع'}</span>
          <input type="text" required={required.includes('subject')} value={values.subject} onChange={set('subject')} disabled={sending} />
        </label>
      ) : null}
      {fields.includes('message') ? (
        <label className="info-field">
          <span>{labels.message ?? 'الرسالة'}</span>
          <textarea rows={5} required={required.includes('message')} value={values.message} onChange={set('message')} disabled={sending} />
        </label>
      ) : null}
      {fields.includes('url') ? (
        <label className="info-field">
          <span>{labels.url ?? 'الرابط'}</span>
          <input type="url" required={required.includes('url')} value={values.url} onChange={set('url')} disabled={sending} dir="ltr" placeholder="https://" />
        </label>
      ) : null}
      <button type="submit" className="btn-gold info-submit" disabled={sending}>
        {sending ? <><Loader size={18} className="info-spin" /> جارٍ الإرسال…</> : submitLabel}
      </button>
    </form>
  );
}

/** A legal text: its sections listed beside it, each one a link down to it. */
export function LegalDoc({ updated, sections }: {
  updated: string;
  sections: { id: string; title: string; body: React.ReactNode }[];
}) {
  return (
    <div className="legal-layout">
      <nav className="legal-toc" aria-label="أقسام الصفحة">
        <p className="legal-toc-title">في هذه الصفحة</p>
        <ol>
          {sections.map(s => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
        </ol>
        <p className="legal-updated">آخر تحديث: {updated}</p>
      </nav>
      <div className="legal-body">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="legal-section">
            <h2><span aria-hidden="true">{i + 1}</span>{s.title}</h2>
            <div className="info-prose">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
