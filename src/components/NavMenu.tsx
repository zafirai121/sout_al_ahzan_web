"use client";

// The menu button (☰) at the top bar's start, on small and medium screens
// (where the sidebar is hidden): a list of the site's places that drops down
// under it. A real button (named, its state told); the list opens on a press,
// from the keyboard too, its first link focused. It closes on choosing a link,
// a press outside it, Escape (back to the button), or leaving it with Tab.

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import './nav-menu.css';

type Place = { label: string; href: string };

const GROUPS: Place[][] = [
  [
    { label: 'الرئيسية', href: '/' },
    { label: 'البحث والأقسام', href: '/search' },
    { label: 'المكتبة الصوتية', href: '/playlists' },
    { label: 'أحدث الإصدارات', href: '/explore?type=recent' },
    { label: 'الراديو', href: '/radio' },
    { label: 'رفع مقطع صوتي', href: '/upload' },
  ],
  [
    { label: 'حسابك', href: '/account' },
    { label: 'الإعدادات', href: '/settings' },
  ],
  [
    { label: 'من نحن', href: '/about' },
    { label: 'المساعدة والدعم', href: '/help' },
    { label: 'اتصل بنا', href: '/contact' },
    { label: 'تطبيق الهاتف', href: '/download' },
  ],
];

const pathOf = (href: string) => href.split('?')[0];

export default function NavMenu() {
  const pathname = usePathname();
  // Open on the page it was opened on: another page (a link chosen, back) closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn !== null && openOn === pathname;
  const setOpen = useCallback((value: boolean | ((was: boolean) => boolean)) => {
    setOpenOn(on => {
      const was = on !== null;
      return (typeof value === 'function' ? value(was) : value) ? pathname : null;
    });
  }, [pathname]);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  const links = () => Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? []);

  const close = useCallback((backToButton = false) => {
    setOpen(false);
    if (backToButton) button.current?.focus();
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    links()[0]?.focus();
    const outside = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    const keys = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(true); } };
    // Wider than the menu's screens (the sidebar is back): closed
    const wide = window.matchMedia('(min-width: 901px)');
    const onWide = () => { if (wide.matches) close(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keys);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keys);
      wide.removeEventListener('change', onWide);
    };
  }, [open, close]);

  // Up and down (and Home, End) go through the links; Tab leaves the list, and the menu closes
  const onListKey = (e: React.KeyboardEvent) => {
    const all = links();
    const at = all.indexOf(document.activeElement as HTMLAnchorElement);
    const go = (i: number) => { e.preventDefault(); all[(i + all.length) % all.length]?.focus(); };
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(all.length - 1);
  };
  const onBlur = (e: React.FocusEvent) => {
    if (open && e.relatedTarget && !wrap.current?.contains(e.relatedTarget as Node)) close();
  };

  const isHere = (href: string) => {
    const path = pathOf(href);
    return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="nav-menu-wrap" ref={wrap} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        className="mobile-hamburger nav-menu-btn"
        aria-label={open ? 'إغلاق القائمة' : 'القائمة'}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(o => !o)}
      >
        {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>
      <nav id={listId} ref={panel} className="nav-menu" aria-label="القائمة الرئيسية" hidden={!open} onKeyDown={onListKey}>
        {GROUPS.map((group, g) => (
          <ul key={g} className="nav-menu-group">
            {group.map(p => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  prefetch={false}
                  className="nav-menu-link"
                  aria-current={isHere(p.href) ? 'page' : undefined}
                  onClick={() => close()}
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </nav>
    </div>
  );
}
