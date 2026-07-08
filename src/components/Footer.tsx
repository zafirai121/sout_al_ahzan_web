import React from 'react';
import Link from 'next/link';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-top">
        <div className="footer-links">
          <div className="footer-column">
            <h4 className="footer-heading">منصة صوت الأحزان</h4>
            <ul className="footer-list">
              <li><Link href="/about">من نحن</Link></li>
              <li><Link href="/contact">اتصل بنا</Link></li>
              <li><Link href="/support">دعم المشروع</Link></li>
              <li><Link href="/jobs">الوظائف</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">للمبدعين</h4>
            <ul className="footer-list">
              <li><Link href="/artists">للروايد والمنشدين</Link></li>
              <li><Link href="/publishers">لوحة الناشرين</Link></li>
              <li><Link href="/developers">المطورين</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">روابط مفيدة</h4>
            <ul className="footer-list">
              <li><Link href="/help">المساعدة والدعم</Link></li>
              <li><Link href="/download">تطبيق الهاتف</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-socials">
          <a href="https://www.instagram.com/sout_alahzan?igsh=MTJvaXh4bnY3a2xrdQ==" target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href="https://t.me/Zafir1199" target="_blank" rel="noopener noreferrer" className="social-icon" title="Telegram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.31-.346-.11l-6.4 4.02-2.76-.86c-.6-.188-.612-.6.126-.89l10.814-4.17c.5-.188.948.112.802.923z"/>
            </svg>
          </a>
          <a href="https://www.facebook.com/share/1D1sfZV93E/" target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
            </svg>
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-legal">
          <ul className="legal-list">
            <li><Link href="/legal">قانوني</Link></li>
            <li><Link href="/privacy-center">مركز الخصوصية</Link></li>
            <li><Link href="/privacy-policy">سياسة الخصوصية</Link></li>
            <li><Link href="/cookies">ملفات تعريف الارتباط</Link></li>
            <li><Link href="/ads">حول الإعلانات</Link></li>
          </ul>
        </div>
        <div className="footer-copyright">
          <span>&copy; {new Date().getFullYear()} منصة صوت الأحزان</span>
        </div>
      </div>
    </footer>
  );
}
