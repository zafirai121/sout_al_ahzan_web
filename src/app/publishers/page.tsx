"use client";

import React, { useState } from 'react';

export default function PublishersPage() {
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
        <span style={{ padding: '8px 16px', backgroundColor: '#333', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: '#b3b3b3' }}>للناشرين وشركات الإنتاج</span>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginTop: '24px', marginBottom: '24px', color: '#F05B28' }}>لوحة الناشرين</h1>
        <p style={{ color: '#b3b3b3', fontSize: '18px', lineHeight: '1.8' }}>
          أداة متقدمة مصممة خصيصاً لتسهيل رفع وتنظيم ونشر الإنتاجات الصوتية الحسينية.
        </p>
      </div>

      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>طلب الانضمام كناشر</h2>
        
        {sent ? (
          <div style={{ backgroundColor: 'rgba(30, 215, 96, 0.1)', border: '1px solid #1ed760', color: '#1ed760', padding: '24px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
            تم استلام طلبك بنجاح! سيقوم فريقنا بمراجعته والتواصل معك قريباً.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <input type="text" required placeholder="اسم الجهة أو الناشر" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
              <input type="email" required placeholder="البريد الإلكتروني الرسمي" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
            </div>
            <textarea placeholder="روابط لأعمالك السابقة أو حساباتك على منصات أخرى (اختياري)" rows={4} value={links} onChange={(e) => setLinks(e.target.value)} disabled={isSubmitting} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', resize: 'vertical', fontSize: '16px', fontFamily: 'inherit' }}></textarea>
            
            <button type="submit" disabled={isSubmitting} style={{ padding: '16px', borderRadius: '32px', border: 'none', background: isSubmitting ? '#555' : '#F05B28', color: '#fff', fontWeight: 'bold', fontSize: '18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.2s', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {isSubmitting ? (
                <>
                  <svg className="fa-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
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
