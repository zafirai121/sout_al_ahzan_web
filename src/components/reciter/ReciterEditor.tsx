"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { canBeCover, ownerPost, uploadCover } from '@/lib/release_settings';
import { COVER_PLACEHOLDER, thumb } from '@/utils/image';
import { foldArabic } from '@/utils/categories';
import { countOf, TRACKS } from '@/utils/plural';
import { DbReciter } from '@/types';
import type { Entry } from '@/components/reciter/ReciterParts';
import '@/components/add-to-playlist.css';

const NOT_A_RECITER = 'مجهول';
const SHOWN = 8;

/**
 * The owner's tools for a reciter's page: their photo (one of their tracks'
 * pictures, or one uploaded), and merging the page into another reciter's
 * when it is the same reciter written otherwise (functions/api/admin/reciter.js).
 */
export default function ReciterEditor({ reciter, entries, onPhoto, onClose }: {
  reciter: DbReciter;
  entries: Entry[];
  onPhoto: (url: string | null) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ text: string; error?: boolean } | null>(null);
  const [others, setOthers] = useState<DbReciter[]>([]);
  const [query, setQuery] = useState('');
  const [into, setInto] = useState<DbReciter | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    supabase.from('reciters').select('id,name,image_url').neq('name', NOT_A_RECITER).neq('id', reciter.id).order('name')
      .then(({ data }) => setOthers((data ?? []) as DbReciter[]));
  }, [reciter.id]);

  // Their tracks' pictures that can be a photo, the most listened first
  const pictures = useMemo(() => {
    const urls = [...entries].sort((a, b) => b.listens - a.listens).map(e => e.track.imageUrl)
      .filter((u): u is string => !!u && u !== COVER_PLACEHOLDER && canBeCover(u));
    return [...new Set(urls)].slice(0, 12);
  }, [entries]);

  const found = useMemo(() => {
    const words = foldArabic(query.trim());
    if (!words) return [];
    return others.filter(r => foldArabic(r.name).includes(words)).slice(0, SHOWN);
  }, [query, others]);

  const setPhoto = async (imageUrl: string | null) => {
    setBusy(true);
    setSaid(null);
    const result = await ownerPost('/api/admin/reciter', { action: 'photo', id: reciter.id, imageUrl });
    setBusy(false);
    if ('error' in result) return setSaid({ text: result.error, error: true });
    onPhoto(imageUrl);
    setSaid({ text: imageUrl ? 'تغيّرت صورة الرادود' : 'أُزيلت صورة الرادود' });
  };

  const upload = async (picked: File | undefined) => {
    if (!picked) return;
    setBusy(true);
    setSaid({ text: 'جارٍ رفع الصورة…' });
    const result = await uploadCover(picked);
    setBusy(false);
    if ('error' in result) setSaid({ text: result.error, error: true });
    else await setPhoto(result.url);
  };

  const merge = async () => {
    if (!into) return;
    setBusy(true);
    setSaid({ text: 'جارٍ الدمج…' });
    const result = await ownerPost<{ merged?: { into: number } }>('/api/admin/reciter', { action: 'merge', from: reciter.id, into: into.id });
    setBusy(false);
    if ('error' in result) return setSaid({ text: result.error, error: true });
    router.push(`/reciter?id=${into.id}`);
    onClose();
  };

  return (
    <div className="pl-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pl-modal rel-modal" role="dialog" aria-modal="true" aria-labelledby="rec-title">
        <header className="pl-head">
          <h2 id="rec-title" className="pl-title">تعديل الرادود</h2>
          <button type="button" className="pl-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="rel-body">
          <section className="rel-part" aria-labelledby="rec-photo">
            <h3 id="rec-photo">صورة {reciter.name}</h3>
            <div className="rel-covers">
              {reciter.image_url && !pictures.includes(reciter.image_url) ? (
                <span className="rel-cover rel-cover--round is-chosen"><img src={thumb(reciter.image_url, 160)} alt="الصورة الحالية" width={80} height={80} /></span>
              ) : null}
              {pictures.map(url => (
                <button
                  key={url}
                  type="button"
                  className={`rel-cover rel-cover--round${url === reciter.image_url ? ' is-chosen' : ''}`}
                  onClick={() => setPhoto(url)}
                  disabled={busy || url === reciter.image_url}
                  aria-label="اجعلها صورة الرادود"
                  aria-pressed={url === reciter.image_url}
                >
                  <img src={thumb(url, 160)} alt="" width={80} height={80} loading="lazy" />
                </button>
              ))}
              <button type="button" className="rel-cover rel-cover--round rel-cover--add" onClick={() => file.current?.click()} disabled={busy}>
                <ImagePlus size={22} />
                <span>ارفع صورة</span>
              </button>
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
            <p className="rel-note">
              {reciter.image_url ? 'الصورة المحاطة بالذهبي هي الحالية.' : 'لا صورة له بعد؛ تظهر على بطاقته صورة أكثر مقاطعه استماعاً.'}
            </p>
          </section>

          <section className="rel-part" aria-labelledby="rec-merge">
            <h3 id="rec-merge">دمج الصفحة في رادود آخر</h3>
            <p className="rel-note">
              إن كانت هذه الصفحة لرادود له صفحة أخرى باسم مكتوب بطريقة ثانية، انقل مقاطعها ({countOf(entries.length, TRACKS)}) إلى صفحته وتُحذف هذه.
              ويُحفظ الاسم، فما يُرفع به لاحقاً يذهب إلى الصفحة الباقية.
            </p>
            {into ? (
              <div className="rec-confirm" role="alertdialog" aria-labelledby="rec-confirm-text">
                <p id="rec-confirm-text">
                  تنتقل مقاطع «{reciter.name}» إلى «{into.name}» وتُحذف صفحة «{reciter.name}». أأدمجهما؟
                </p>
                <div className="rel-row">
                  <button type="button" className="rel-btn" onClick={merge} disabled={busy}>نعم، ادمجهما</button>
                  <button type="button" className="rel-link" onClick={() => setInto(null)} disabled={busy}>إلغاء</button>
                </div>
              </div>
            ) : (
              <>
                <input
                  className="rel-search"
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="اكتب اسم الرادود الذي تُدمج فيه"
                  aria-label="ابحث عن الرادود الذي تُدمج فيه الصفحة"
                />
                {found.length > 0 ? (
                  <ul className="rel-tracks">
                    {found.map(r => (
                      <li key={r.id} className="rel-track">
                        <span className="rel-track-title">{r.name}</span>
                        <button type="button" className="rel-btn" onClick={() => setInto(r)} disabled={busy}>ادمج فيه</button>
                      </li>
                    ))}
                  </ul>
                ) : query.trim() ? <p className="rel-note">لا رادود بهذا الاسم.</p> : null}
              </>
            )}
          </section>
        </div>

        <p className={`rel-status${said?.error ? ' is-error' : ''}`} role={said?.error ? 'alert' : 'status'}>{said?.text ?? ''}</p>
      </div>
    </div>
  );
}
