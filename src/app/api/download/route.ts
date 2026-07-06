import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  let name = searchParams.get('name') || 'download.mp3';

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Ensure name ends with .mp3
  if (!name.endsWith('.mp3')) {
    name += '.mp3';
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return new NextResponse(`Failed to fetch from remote: ${response.statusText}`, { status: response.status });
    }

    const headers = new Headers();
    // Force download by setting Content-Disposition
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
    headers.set('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
    
    // Pass along content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Proxy download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
