"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import './AuthModal.css';
import { CirclePlus, Lock, Mail, X } from 'lucide-react';

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
          <X size={20} />
        </button>

        <div className="auth-modal-logo">
          <CirclePlus size={48} />
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
            <Mail size={20} className="auth-input-icon" />
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
            <Lock size={20} className="auth-input-icon" />
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
