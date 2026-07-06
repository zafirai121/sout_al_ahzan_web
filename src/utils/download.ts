export const downloadTrack = async (audioUrl: string, fileName: string): Promise<boolean> => {
  try {
    // We use our Next.js API route as a proxy to bypass CORS restrictions
    // and force the browser to download the file instead of opening it.
    const proxyUrl = `/api/download?url=${encodeURIComponent(audioUrl)}&name=${encodeURIComponent(fileName)}`;
    
    // Create an invisible anchor tag to trigger the download
    const link = document.createElement('a');
    link.href = proxyUrl;
    // target="_blank" ensures that if it somehow doesn't download, it opens in a new tab
    // rather than navigating the user away from the app.
    link.target = '_blank';
    link.download = fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    // Ultimate fallback
    window.open(audioUrl, '_blank');
    return false;
  }
};
