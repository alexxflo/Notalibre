'use client';
import { NextRequest, NextResponse } from 'next/server';
import { processWhatsappMessage } from '@/ai/flows/process-whatsapp-message';

export async function POST(req: NextRequest) {
  // Check for the secret token in query parameters
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

  if (!expectedSecret) {
      console.error('CRITICAL: WHATSAPP_WEBHOOK_SECRET is not set in environment variables.');
      // Do not expose details about the missing secret to the client.
      return NextResponse.json({ success: false, message: 'Internal Server Configuration Error' }, { status: 500 });
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // This is a simplified example assuming the payload is: { message: "..." }
    // The actual payload from your WhatsApp provider might be more complex, like:
    // body.entry[0].changes[0].value.messages[0].text.body
    const messageText = body?.message;

    if (!messageText) {
      return NextResponse.json({ success: false, message: 'Invalid payload, expected { "message": "..." }' }, { status: 400 });
    }

    const result = await processWhatsappMessage({ message: messageText });

    if (!result.success) {
      // Log the error for debugging.
      console.error('WhatsApp webhook processing failed:', result.message);
      // Still return 200 OK to WhatsApp to prevent it from retrying.
      return NextResponse.json({ processed: true, details: result.message });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in WhatsApp webhook:', error);
    // Return 200 OK even on most errors to prevent WhatsApp from disabling the webhook.
    return NextResponse.json({ processed: false, message: error.message || 'Internal Server Error' });
  }
}

/**
 * Note: For the initial WhatsApp webhook setup, you'll need to handle a GET request
 * to verify your endpoint. This typically involves checking a verify token
 * and responding with a challenge. This has been omitted for simplicity but is
 * required by WhatsApp.
 */
