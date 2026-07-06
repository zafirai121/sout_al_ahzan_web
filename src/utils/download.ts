export const downloadTrack = async (audioUrl: string, fileName: string): Promise<boolean> => {
  try {
    const response = await fetch(audioUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (error) {
    console.warn('Download failed via blob (CORS issue), falling back to window.open:', error);
    // Fallback: If CORS blocks the fetch, we open in a new tab
    alert("بسبب إعدادات الحماية في سيرفر التخزين (CORS)، سيتم فتح المقطع في نافذة جديدة بدلاً من التنزيل المباشر.\n\nطريقة الحفظ: بعد فتح النافذة، اضغط على زر (النقاط الثلاث ⋮) في مشغل الصوت واختر 'تنزيل' (Download).");
    window.open(audioUrl, '_blank');
    return false; // Return false so the UI knows it didn't download seamlessly, but we handled it.
  }
};
