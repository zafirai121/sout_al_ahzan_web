"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import SideBar from '@/components/SideBar';
import PlayerBar from '@/components/PlayerBar';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [reciterName, setReciterName] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>جاري التحقق من تسجيل الدخول...</div>;
  }

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
      } else {
        setErrorMsg('يرجى اختيار ملف صوتي فقط.');
      }
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setCoverFile(file);
      } else {
        setErrorMsg('يرجى اختيار صورة فقط للغلاف.');
      }
    }
  };

  const uploadToStorage = async (bucket: string, file: File, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    
    if (!title || !reciterName || !audioFile) {
      setErrorMsg("يرجى تعبئة الحقول المطلوبة (العنوان، الرادود، والملف الصوتي).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setStatusMsg("جاري رفع الملف الصوتي...");

    try {
      const timestamp = Date.now();
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      const audioPath = `user_${user.id}/${timestamp}_${safeTitle}.mp3`;

      // 1. Upload Audio
      const audioUrl = await uploadToStorage('user-uploads', audioFile, audioPath);
      setUploadProgress(50);

      // 2. Upload Cover (if exists)
      let coverUrl = null;
      if (coverFile) {
        setStatusMsg("جاري رفع صورة الغلاف...");
        const coverPath = `user_${user.id}/${timestamp}_cover_${safeTitle}.jpg`;
        coverUrl = await uploadToStorage('user-uploads', coverFile, coverPath);
      }
      setUploadProgress(75);

      // 3. Insert into Database
      setStatusMsg("جاري حفظ البيانات...");
      
      const dbFileName = `${reciterName.trim()} - ${title.trim()}.mp3`;
      const finalImageUrl = coverUrl || 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=500';

      const { error: dbError } = await supabase.from('audio_library').insert([
        {
          file_name: dbFileName,
          title: title.trim(),
          reciter_name: reciterName.trim(),
          file_url: audioUrl,
          image_url: finalImageUrl,
          lyrics: description,
          user_id: user.id,
          duration: '0:00',
          status: 'pending',
          category: 'منوعات'
        }
      ]);

      if (dbError) {
        console.error("DB Insert Error:", dbError);
        throw new Error(dbError.message || JSON.stringify(dbError));
      }

      setUploadProgress(100);
      setStatusMsg("تم رفع المقطع بنجاح!");
      setIsSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setTitle("");
        setReciterName("");
        setDescription("");
        setAudioFile(null);
        setCoverFile(null);
        setIsUploading(false);
        setUploadProgress(0);
        setIsSuccess(false);
        setStatusMsg("");
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ غير معروف أثناء الرفع. تأكد من إعدادات Supabase Storage.");
      setIsUploading(false);
    }
  };

  return (
    <div className="layout">
      <SideBar />
      <main className="main-content">
        <TopBar />
        
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#fff', width: '100%' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#F05B28' }}>رفع مقطع صوتي</h1>
          <p style={{ color: '#b3b3b3', marginBottom: '32px' }}>شارك قصائدك وإصداراتك مع ملايين المستمعين حول العالم.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#181818', padding: '32px', borderRadius: '16px' }}>
            
            {/* Audio File Dropzone */}
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleAudioDrop}
              onClick={() => audioInputRef.current?.click()}
              style={{ border: '2px dashed #333', padding: '40px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1ed760'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
            >
              <input 
                type="file" 
                accept="audio/*" 
                ref={audioInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) setAudioFile(e.target.files[0]);
                }}
              />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              {audioFile ? (
                <div style={{ color: '#1ed760', fontWeight: 'bold' }}>تم اختيار الملف: {audioFile.name}</div>
              ) : (
                <div style={{ color: '#b3b3b3' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>اضغط لاختيار ملف صوتي</span> أو قم بسحبه وإفلاته هنا<br/>
                  <span style={{ fontSize: '12px', marginTop: '8px', display: 'inline-block' }}>صيغ مدعومة: MP3, WAV (الحد الأقصى 50MB)</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3', fontSize: '14px' }}>العنوان *</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  disabled={isUploading}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} 
                  placeholder="مثال: قصيدة يا حسين"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3', fontSize: '14px' }}>الرادود / المنشد *</label>
                <input 
                  type="text" 
                  required 
                  value={reciterName} 
                  onChange={(e) => setReciterName(e.target.value)} 
                  disabled={isUploading}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} 
                  placeholder="مثال: باسم الكربلائي"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3', fontSize: '14px' }}>الوصف / كلمات القصيدة</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  disabled={isUploading}
                  rows={5}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px', resize: 'none' }} 
                  placeholder="اكتب وصفاً أو كلمات القصيدة هنا..."
                />
              </div>

              {/* Cover File Dropzone */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3', fontSize: '14px' }}>صورة الغلاف (اختياري)</label>
                <div 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleCoverDrop}
                  onClick={() => coverInputRef.current?.click()}
                  style={{ height: '140px', border: '2px dashed #333', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s', overflow: 'hidden' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1ed760'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={coverInputRef} 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) setCoverFile(e.target.files[0]);
                    }}
                  />
                  {coverFile ? (
                    <img src={URL.createObjectURL(coverFile)} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span style={{ fontSize: '12px', color: '#b3b3b3' }}>اختر صورة</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(226, 33, 52, 0.1)', color: '#e22134', padding: '12px', borderRadius: '8px', fontSize: '14px', border: '1px solid #e22134' }}>
                {errorMsg}
              </div>
            )}

            {isSuccess && (
              <div style={{ backgroundColor: 'rgba(30, 215, 96, 0.1)', color: '#1ed760', padding: '12px', borderRadius: '8px', fontSize: '14px', border: '1px solid #1ed760', fontWeight: 'bold' }}>
                تم رفع المقطع بنجاح! شكراً لمساهمتك.
              </div>
            )}

            {isUploading && (
              <div style={{ width: '100%', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', height: '6px', marginTop: '8px' }}>
                <div style={{ width: `${uploadProgress}%`, backgroundColor: '#1ed760', height: '100%', transition: 'width 0.3s ease' }}></div>
              </div>
            )}
            
            {statusMsg && (
              <div style={{ fontSize: '12px', color: '#b3b3b3', textAlign: 'center' }}>{statusMsg}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="submit" 
                disabled={isUploading || !audioFile} 
                style={{ padding: '16px 40px', backgroundColor: (isUploading || !audioFile) ? '#555' : '#F05B28', color: '#fff', borderRadius: '32px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: (isUploading || !audioFile) ? 'not-allowed' : 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isUploading ? 'جاري الرفع...' : 'رفع المقطع الآن'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <PlayerBar />
    </div>
  );
}
