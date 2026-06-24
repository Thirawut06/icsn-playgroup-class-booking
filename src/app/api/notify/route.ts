import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text || body.message;

    if (!text) {
      return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
    }

    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn("GOOGLE_CHAT_WEBHOOK_URL is not configured.");
      return NextResponse.json({ success: false, error: 'Webhook not configured' }, { status: 500 });
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Google Chat Webhook error:", errorText);
      return NextResponse.json({ success: false, error: 'Failed to send to Google Chat' }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending Google Chat notification:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
