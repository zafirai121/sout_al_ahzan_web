"use client";

import React, { useState } from 'react';
import { Loader } from 'lucide-react';

export default function ArtistsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [links, setLinks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span style={{ padding: '8px 16px', backgroundColor: '#333', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: '#b3b3b3' }}>للروايد والمنشدين</span>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginTop: '24px', marginBottom: '24px', color: '#F05B28' }}>انضم إلينا</h1>
        <p style={{ color: '#b3b3b3', fontSize: '18px', lineHeight: '1.8' }}>
          أوصل صوتك إلى ملايين المستمعين حول العالم. منصة صوت الأحزان هي الوجهة الأولى للاستماع الحسيني.
        </p>
      </div>

      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>طلب الانضمام كمنشد / رادود</h2>
        
        {sent ? (
          <div style={{ backgroundColor: 'rgba(30, 215, 96, 0.1)', border: '1px solid #1ed760', color: '#1ed760', padding: '24px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
            تم استلام طلبك بنجاح! سيقوم فريقنا بمراجعته والتواصل معك قريباً.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <input type="text" required placeholder="الاسم الكامل أو الفني" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
              <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
            </div>
            <textarea placeholder="روابط لأعمالك السابقة أو قنواتك على يوتيوب وغيرها" rows={4} value={links} onChange={(e) => setLinks(e.target.value)} disabled={isSubmitting} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', resize: 'vertical', fontSize: '16px', fontFamily: 'inherit' }}></textarea>
            
            <button type="submit" disabled={isSubmitting} style={{ padding: '16px', borderRadius: '32px', border: 'none', background: isSubmitting ? '#555' : '#F05B28', color: '#fff', fontWeight: 'bold', fontSize: '18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.2s', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {isSubmitting ? (
                <>
                  <Loader size={20} className="fa-spin" />
                  جاري الإرسال...
                </>
              ) : 'إرسال طلب الانضمام'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
