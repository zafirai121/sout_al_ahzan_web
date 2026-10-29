"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ownerPost, uploadCover } from '@/lib/release_settings';
import { changedFields, TrackField, TrackForm } from '@/lib/track_edit';
import { CATEGORY_LIST, categoryCode } from '@/utils/categories';
import { thumb } from '@/utils/image';
import '@/components/add-to-playlist.css';
import '@/components/reciter/reciter.css';

const NOT_A_RECITER = 'مجهول';
const LABELS: Record<TrackField, string> = {
  title: 'العنوان',
  reciter_name: 'الرادود',
  category: 'القسم',
  album: 'الإصدار',
  occasion: 'المناسبة',
  year: 'السنة',
  location: 'المكان',
  lyrics: 'الكلمات',
  image_url: 'الغلاف',
};

type Row = { id: number | string; reciter_id?: number | string | null } & Partial<Record<TrackField, string | null>>;

/**
 * The owner's edit of one track: every detail but its sound file, saved
 * through functions/api/update-track.js (which checks the admin role again).
 * A new reciter's name puts the track on that reciter's page.
 */
export default function TrackEditor({ row, onSaved, onClose }: {
  row: Row;
  onSaved: (updated: Row) => void;
  onClose: () => void;
}) {
  // What it was, the category as the apps' code
  const before: TrackForm = useMemo(() => ({
    title: row.title ?? '',
    reciter_name: row.reciter_name ?? '',
    category: categoryCode(row.category),
    album: row.album ?? '',
    occasion: row.occasion ?? '',
    year: row.year ?? '',
    location: row.location ?? '',
    lyrics: row.lyrics ?? '',
    image_url: row.image_url ?? '',
  }), [row]);
  const [form, setForm] = useState<TrackForm>(before);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ text: string; error?: boolean } | null>(null);
  const [reciters, setReciters] = useState<string[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The names to choose from: every reciter, and this reciter's releases
  useEffect(() => {
    supabase.from('reciters').select('name').neq('name', NOT_A_RECITER).order('name')
      .then(({ data }) => setReciters((data ?? []).map(r => r.name)));
    if (!row.reciter_id) return;
    supabase.from('audio_library').select('album').eq('reciter_id', row.reciter_id).not('album', 'is', null).limit(1000)
      .then(({ data }) => setAlbums([...new Set((data ?? []).map(r => (r.album ?? '').trim()).filter(Boolean))].sort()));
  }, [row.reciter_id]);

  const set = (key: TrackField) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const upload = async (picked: File | undefined) => {
    if (!picked) return;
    setBusy(true);
    setSaid({ text: 'جارٍ رفع الصورة…' });
    const result = await uploadCover(picked);
    setBusy(false);
    if ('error' in result) return setSaid({ text: result.error, error: true });
    setForm(f => ({ ...f, image_url: result.url }));
    setSaid({ text: 'رُفعت الصورة، اضغط «احفظ» لتصير غلاف المقطع.' });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const changed = changedFields(before, form);
    if ('missing' in changed) return setSaid({ text: `لا يبقى «${LABELS[changed.missing]}» فارغاً.`, error: true });
    if (Object.keys(changed.fields).length === 0) return setSaid({ text: 'لم يتغيّر شيء.' });
    setBusy(true);
    setSaid(null);
    const result = await ownerPost<{ track?: Row }>('/api/update-track', { id: Number(row.id), fields: changed.fields });
    setBusy(false);
    if ('error' in result) return setSaid({ text: result.error, error: true });
    if (!result.ok.track) return setSaid({ text: 'لم يُحفظ التعديل.', error: true });
    onSaved(result.ok.track);
    onClose();
  };

  const field = (key: TrackField, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="trk-field">
      <span>{LABELS[key]}</span>
      <input value={form[key] ?? ''} onChange={set(key)} disabled={busy} {...extra} />
    </label>
  );

  return (
    <div className="pl-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="pl-modal rel-modal trk-modal" role="dialog" aria-modal="true" aria-labelledby="trk-title" onSubmit={save}>
        <header className="pl-head">
          <h2 id="trk-title" className="pl-title">تعديل المقطع</h2>
          <button type="button" className="pl-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="rel-body">
          <div className="trk-top">
            <button type="button" className="trk-cover" onClick={() => file.current?.click()} disabled={busy} aria-label="غيّر الغلاف">
              {form.image_url ? <img src={thumb(form.image_url, 240)} alt="" width={120} height={120} /> : null}
              <span className="trk-cover-change"><ImagePlus size={18} />غيّر الغلاف</span>
            </button>
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
            <div className="trk-main">
              {field('title', { maxLength: 300, required: true })}
              {field('reciter_name', { maxLength: 200, required: true, list: 'trk-reciters' })}
            </div>
          </div>
          <datalist id="trk-reciters">{reciters.map(n => <option key={n} value={n} />)}</datalist>
          <datalist id="trk-albums">{albums.map(n => <option key={n} value={n} />)}</datalist>
          {form.reciter_name?.trim() !== before.reciter_name?.trim() ? (
            <p className="rel-note">ينتقل المقطع إلى صفحة «{form.reciter_name?.trim()}»، وتُنشأ له صفحة إن لم تكن.</p>
          ) : null}

          <div className="trk-grid">
            <label className="trk-field">
              <span>{LABELS.category}</span>
              <select value={form.category ?? ''} onChange={set('category')} disabled={busy}>
                <option value="">بلا قسم</option>
                {CATEGORY_LIST.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            {field('album', { maxLength: 300, list: 'trk-albums', placeholder: 'بلا إصدار' })}
            {field('occasion', { maxLength: 200 })}
            {field('year', { maxLength: 20, placeholder: 'مثل 1446' })}
            {field('location', { maxLength: 200 })}
          </div>

          <label className="trk-field">
            <span>{LABELS.lyrics}</span>
            <textarea value={form.lyrics ?? ''} onChange={set('lyrics')} rows={8} maxLength={30000} disabled={busy} />
          </label>
        </div>

        <footer className="trk-foot">
          <p className={`rel-status${said?.error ? ' is-error' : ''}`} role={said?.error ? 'alert' : 'status'}>{said?.text ?? ''}</p>
          <button type="button" className="rel-link" onClick={onClose} disabled={busy}>إلغاء</button>
          <button type="submit" className="rel-btn" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'احفظ'}</button>
        </footer>
      </form>
    </div>
  );
}
