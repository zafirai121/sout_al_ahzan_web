"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpTopics = [
    { title: "الحساب وتسجيل الدخول", desc: "مساعدة في إدارة حسابك وكلمة المرور.", link: "/support" },
    { title: "مشاكل التشغيل والصوت", desc: "حلول لمشاكل التقطيع أو عدم عمل المشغل.", link: "/support" },
    { title: "الاشتراكات والمدفوعات", desc: "كل ما يخص الاشتراك في النسخة المميزة.", link: "/support" },
    { title: "تواصل مع خدمة العملاء", desc: "فريقنا جاهز للرد على استفساراتك مباشرة.", link: "/contact" },
    { title: "الناشرين وشركات الإنتاج", desc: "تعرف على كيفية رفع المحتوى وإدارته.", link: "/publishers" },
    { title: "للروايد والمنشدين", desc: "انضم إلينا لتوثيق صفحتك ونشر قصائدك.", link: "/artists" }
  ];

  const filteredTopics = helpTopics.filter(topic => 
    topic.title.includes(searchQuery) || topic.desc.includes(searchQuery)
  );

  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>كيف يمكننا مساعدتك؟</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن مشكلة (مثال: حساب، دفع، تسجيل...)" 
          style={{ width: '100%', maxWidth: '600px', padding: '16px 24px', borderRadius: '32px', border: '1px solid #444', outline: 'none', fontSize: '18px', backgroundColor: '#282828', color: '#fff' }} 
        />
      </div>

      {filteredTopics.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredTopics.map((topic, idx) => (
            <Link href={topic.link} key={idx} style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', textDecoration: 'none', color: '#fff', transition: '0.2s', border: '1px solid transparent' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#555'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{topic.title}</h3>
              <p style={{ color: '#b3b3b3', margin: 0, lineHeight: '1.6' }}>{topic.desc}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#b3b3b3', fontSize: '18px' }}>
          لا توجد نتائج مطابقة لبحثك. يرجى <Link href="/contact" style={{ color: '#1ed760' }}>التواصل مع خدمة العملاء</Link> لمساعدتك.
        </div>
      )}
    </div>
  );
}
