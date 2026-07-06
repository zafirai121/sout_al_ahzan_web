export type DownloadResult = 'SUCCESS' | 'CORS_FALLBACK' | 'ERROR';

export const downloadTrack = async (audioUrl: string, fileName: string): Promise<DownloadResult> => {
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
    return 'SUCCESS';
  } catch (error) {
    console.warn('Download failed via blob (CORS issue), falling back to window.open:', error);
    // Fallback: If CORS blocks the fetch, we open in a new tab
    window.open(audioUrl, '_blank');
    return 'CORS_FALLBACK';
  }
};
