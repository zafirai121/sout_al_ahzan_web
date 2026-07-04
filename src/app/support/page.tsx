"use client";

import React, { useState } from 'react';

export default function SupportPage() {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>كيف يمكننا مساعدتك؟</h1>
      
      <div style={{ backgroundColor: '#282828', padding: '32px', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>تواصل مع فريق الدعم</h2>
        
        {sent ? (
          <div style={{ backgroundColor: '#1ed760', color: '#000', padding: '16px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
            تم إرسال رسالتك بنجاح! سيتم الرد عليك قريباً.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="الاسم الكامل" style={{ padding: '14px', borderRadius: '4px', border: '1px solid #727272', background: 'transparent', color: '#fff' }} />
            <input type="email" placeholder="البريد الإلكتروني" style={{ padding: '14px', borderRadius: '4px', border: '1px solid #727272', background: 'transparent', color: '#fff' }} />
            <textarea placeholder="كيف يمكننا مساعدتك؟ يرجى كتابة تفاصيل المشكلة هنا..." rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} style={{ padding: '14px', borderRadius: '4px', border: '1px solid #727272', background: 'transparent', color: '#fff', resize: 'vertical' }}></textarea>
            <button onClick={() => setSent(true)} style={{ padding: '16px', borderRadius: '32px', border: 'none', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', alignSelf: 'flex-start' }}>إرسال الرسالة</button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>الأسئلة الشائعة</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#282828', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>كيف يمكنني إعادة تعيين كلمة المرور؟</h3>
            <p style={{ margin: 0, color: '#b3b3b3' }}>يمكنك إعادة تعيين كلمة المرور من خلال صفحة تسجيل الدخول بالضغط على "نسيت كلمة المرور" واتباع التعليمات التي ستصلك عبر البريد.</p>
          </div>
          <div style={{ backgroundColor: '#282828', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>هل المنصة مجانية؟</h3>
            <p style={{ margin: 0, color: '#b3b3b3' }}>نعم، المنصة الأساسية مجانية بالكامل. توجد باقات Premium اختيارية للميزات الإضافية.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
