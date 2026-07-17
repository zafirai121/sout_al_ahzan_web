"use client";

import React, { useState } from 'react';

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "كيف يمكنني إعادة تعيين كلمة المرور؟",
      a: "يمكنك إعادة تعيين كلمة المرور من خلال صفحة تسجيل الدخول بالضغط على 'نسيت كلمة المرور' واتباع التعليمات التي ستصلك عبر البريد."
    },
    {
      q: "هل المنصة مجانية؟",
      a: "نعم، المنصة الأساسية مجانية بالكامل. توجد باقات Premium اختيارية للميزات الإضافية وللتخلص من الإعلانات."
    },
    {
      q: "كيف يمكنني دعم المشروع؟",
      a: "يمكنك دعم المشروع مادياً من خلال وسائل الدفع المتوفرة قريباً، أو معنوياً بمشاركة التطبيق مع أصدقائك والدعاء لنا."
    },
    {
      q: "هل يمكنني تشغيل المقاطع بدون إنترنت؟",
      a: "نعم، يمكنك تنزيل المقاطع للاستماع إليها لاحقاً بدون الحاجة للاتصال بالإنترنت من خلال الضغط على زر التحميل الموجود بجوار كل مقطع."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !msg) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>الدعم والمساعدة</h1>
      <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '18px', marginBottom: '48px', lineHeight: '1.8' }}>
        نحن هنا لمساعدتك والإجابة على جميع استفساراتك المتعلقة باستخدام منصة صوت الأحزان.
      </p>
      
      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>تواصل مع فريق الدعم الفني</h2>
        
        {sent ? (
          <div style={{ backgroundColor: 'rgba(30, 215, 96, 0.1)', border: '1px solid #1ed760', color: '#1ed760', padding: '24px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
            تم إرسال رسالتك بنجاح! سيتم الرد عليك في أقرب وقت.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <input type="text" required placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
              <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
            </div>
            <textarea required placeholder="كيف يمكننا مساعدتك؟ يرجى كتابة تفاصيل المشكلة هنا..." rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} disabled={isSubmitting} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', resize: 'vertical', fontSize: '16px', fontFamily: 'inherit' }}></textarea>
            
            <button type="submit" disabled={isSubmitting} style={{ padding: '16px', borderRadius: '32px', border: 'none', background: isSubmitting ? '#555' : '#F05B28', color: '#fff', fontWeight: 'bold', fontSize: '18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.2s', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSubmitting ? (
                <>
                  <svg className="fa-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                  جاري الإرسال...
                </>
              ) : 'إرسال طلب الدعم'}
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>الأسئلة الشائعة</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, index) => (
            <div key={index} style={{ backgroundColor: '#181818', borderRadius: '8px', overflow: 'hidden' }}>
              <button 
                onClick={() => toggleFaq(index)}
                style={{ width: '100%', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', textAlign: 'right' }}
              >
                <span style={{ fontWeight: 'bold' }}>{faq.q}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openFaq === index && (
                <div style={{ padding: '0 24px 24px 24px', color: '#b3b3b3', fontSize: '16px', lineHeight: '1.6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
