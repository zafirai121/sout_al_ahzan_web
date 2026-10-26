"use client";

// The foot of every page: the name and what the site is, the way to the phone
// app, today's hijri date (the calendar the site lives by), the links, and
// where to follow it.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import './Footer.css';

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'استمع',
    links: [
      ['قصائد حسينية', '/category/hussainiya_poems'],
      ['مواليد', '/category/muwalid'],
      ['أدعية ومناجاة', '/category/dua'],
      ['زيارات', '/category/ziyarat'],
      ['كل الرواديد', '/search'],
    ],
  },
  {
    title: 'المنصة',
    links: [
      ['من نحن', '/about'],
      ['اتصل بنا', '/contact'],
      ['الدعم الفني', '/support'],
      ['الوظائف', '/jobs'],
    ],
  },
  {
    title: 'للرواديد والمنشدين',
    links: [
      ['انضم إلى المنصة', '/artists'],
      ['لوحة الناشرين', '/publishers'],
    ],
  },
  {
    title: 'المساعدة',
    links: [
      ['المساعدة والدعم', '/help'],
      ['تطبيق الهاتف', '/download'],
    ],
  },
];

const LEGAL: [string, string][] = [
  ['قانوني', '/legal'],
  ['مركز الخصوصية', '/privacy-center'],
  ['سياسة الخصوصية', '/privacy-policy'],
  ['ملفات تعريف الارتباط', '/cookies'],
  ['حول الإعلانات', '/ads'],
];

const SOCIAL = [
  {
    name: 'إنستغرام',
    href: 'https://www.instagram.com/sout_alahzan?igsh=MTJvaXh4bnY3a2xrdQ==',
    icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  {
    name: 'تيليغرام',
    href: 'https://t.me/Zafir1199',
    icon: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.31-.346-.11l-6.4 4.02-2.76-.86c-.6-.188-.612-.6.126-.89l10.814-4.17c.5-.188.948.112.802.923z',
  },
  {
    name: 'فيسبوك',
    href: 'https://www.facebook.com/share/1D1sfZV93E/',
    icon: 'M12 0a12 12 0 100 24 12 12 0 000-24zm3.5 7h-1.5c-.8 0-1 .4-1 1v1.5h2.5l-.5 2.5h-2v7h-3v-7h-2v-2.5h2v-2c0-2 1.2-3 3-3h1.5v2.5z',
  },
];

export default function Footer() {
  // The visitor's date, known only in the browser (the page is built ahead)
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));
  }, []);

  return (
    <footer className="site-footer">
      <div className="site-footer-ornament" aria-hidden="true" />

      <div className="site-footer-top">
        <div className="site-footer-brand">
          <p className="site-footer-name">صوت الأحزان</p>
          <p className="site-footer-about">
            مكتبة صوتية للقصائد الحسينية واللطميات والمواليد والأدعية، بأصوات الرواديد والمنشدين، بلا إعلانات.
          </p>
          <div className="site-footer-actions">
            <Link href="/download" prefetch={false} className="btn-gold">تطبيق الهاتف</Link>
            <Link href="/search" prefetch={false} className="btn-outline">تصفّح الرواديد</Link>
          </div>
          <p className="site-footer-today">{today ? <>اليوم {today}</> : ' '}</p>
        </div>

        <nav className="site-footer-columns" aria-label="روابط الموقع">
          {COLUMNS.map(column => (
            <div key={column.title}>
              <h2 className="site-footer-heading">{column.title}</h2>
              <ul>
                {column.links.map(([label, href]) => (
                  <li key={href}><Link href={href} prefetch={false}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="site-footer-social" role="group" aria-label="تابعنا">
        {SOCIAL.map(s => (
          <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={s.icon} /></svg>
            {s.name}
          </a>
        ))}
      </div>

      <div className="site-footer-bottom">
        <ul className="site-footer-legal">
          {LEGAL.map(([label, href]) => (
            <li key={href}><Link href={href} prefetch={false}>{label}</Link></li>
          ))}
        </ul>
        {/* Built at deploy time: the year may turn before the next deploy */}
        <p className="site-footer-copy" suppressHydrationWarning>&copy; {new Date().getFullYear()} منصة صوت الأحزان</p>
      </div>
    </footer>
  );
}
