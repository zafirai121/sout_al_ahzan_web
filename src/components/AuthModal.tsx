"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthModal({ onClose, initialIsLogin = true }: { onClose: () => void, initialIsLogin?: boolean }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setErrorMsg('تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني لتفعيله.');
          setLoading(false);
          return;
        }
      }
      onClose();
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes('Invalid login credentials')) msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      else if (msg.includes('already registered')) msg = 'هذا الحساب مسجل مسبقاً';
      else if (msg.includes('Password should be at least')) msg = 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل';
      else if (msg.includes('Email not confirmed')) msg = 'يرجى تأكيد بريدك الإلكتروني أولاً';
      setErrorMsg(msg || 'حدث خطأ أثناء المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#000',
        padding: '32px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #333'
      }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/></svg>
        </div>

        <h2 style={{ fontSize: '24px', margin: '0 0 24px 0', color: '#fff', fontWeight: 'bold' }}>
          {isLogin ? 'تسجيل الدخول إلى صوت الأحزان' : 'إنشاء حساب جديد'}
        </h2>

        {errorMsg && (
          <div style={{ color: '#f15e6c', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <input 
            type="email" 
            placeholder="البريد الإلكتروني" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #727272', background: 'transparent', color: '#fff', direction: 'ltr' }}
          />
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #727272', background: 'transparent', color: '#fff', direction: 'ltr' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
          />
        </div>

        <button 
          onClick={handleAuth}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: '24px', border: 'none', background: '#1ed760', color: '#000', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : 'التسجيل')}
        </button>

        <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
          {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <span 
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
            style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'اشترك الآن' : 'سجل الدخول'}
          </span>
        </div>
      </div>
    </div>
  );
}
