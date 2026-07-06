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
    console.error('Download failed via blob, falling back to window.open:', error);
    // Fallback: If CORS blocks the fetch, we open in a new tab
    // Some browsers might play it, but it's the best fallback.
    window.open(audioUrl, '_blank');
    return false;
  }
};
