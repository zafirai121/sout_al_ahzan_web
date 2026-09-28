// Sends a form message to /api/contact (functions/api/contact.js), which
// stores it in Supabase for the site owner to read.
export type ContactKind = 'contact' | 'support' | 'job' | 'artist' | 'publisher';

export const SEND_ERROR = 'تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى.';

export async function sendContactMessage(payload: {
  kind: ContactKind;
  name: string;
  email: string;
  subject?: string;
  message?: string;
}): Promise<void> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`contact failed: ${res.status}`);
}
