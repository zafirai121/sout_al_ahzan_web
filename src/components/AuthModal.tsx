"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import './AuthModal.css';

export default function AuthModal({ onClose, initialIsLogin = true }: { onClose: () => void, initialIsLogin?: boolean }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!email || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setSuccessMsg('تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني لتفعيله.');
          setLoading(false);
          return;
        }
        onClose();
      }
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes('Invalid login credentials')) msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      else if (msg.includes('already registered')) msg = 'هذا الحساب مسجل مسبقاً';
      else if (msg.includes('Password should be at least')) msg = 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل';
      else if (msg.includes('Email not confirmed')) msg = 'يرجى تأكيد بريدك الإلكتروني أولاً';
      setErrorMsg(msg || 'حدث خطأ أثناء المصادقة');
    } finally {
      if (!successMsg) {
        setLoading(false);
      }
    }
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal-container">
        <button className="auth-modal-close" onClick={onClose} aria-label="إغلاق">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div className="auth-modal-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/>
          </svg>
        </div>

        <h2 className="auth-modal-title">
          {isLogin ? 'مرحباً بعودتك' : 'انضم إلينا الآن'}
        </h2>
        <p className="auth-modal-subtitle">
          {isLogin ? 'سجل دخولك للاستماع لقصائدك المفضلة' : 'أنشئ حسابك المجاني وتمتع بميزات حصرية'}
        </p>

        {errorMsg && <div className="auth-message auth-error">{errorMsg}</div>}
        {successMsg && <div className="auth-message auth-success">{successMsg}</div>}

        <div className="auth-form">
          <div className="auth-input-group">
            <input 
              type="email" 
              className="auth-input"
              placeholder="البريد الإلكتروني" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>

          <div className="auth-input-group">
            <input 
              type="password" 
              className="auth-input"
              placeholder="كلمة المرور" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
              disabled={loading}
            />
            <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

        <button 
          className="auth-submit-btn"
          onClick={handleAuth}
          disabled={loading}
        >
          {loading ? <span className="auth-loader"></span> : (isLogin ? 'تسجيل الدخول' : 'التسجيل المجاني')}
        </button>

        <div className="auth-switch-text">
          {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <span 
            className="auth-switch-link"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }} 
          >
            {isLogin ? 'اشترك الآن' : 'سجل الدخول'}
          </span>
        </div>
      </div>
    </div>
  );
}
