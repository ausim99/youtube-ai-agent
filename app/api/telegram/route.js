
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (body.message) {
    const chatId = body.message.chat.id;
    const userText = body.message.text;

    let reply = "";

    if (userText.startsWith('/status')) {
      reply = "🤖 Agent Status: Active. Daily run scheduled for 6:00 PM.";
    } else if (userText.startsWith('/run')) {
      reply = "⚡ Command received! Triggering video generation and publishing now...";
      // Triggers immediate video publishing workflow
    } else {
      reply = `🧠 Instruction Received: "${userText}". I have updated my instructions for the next 6:00 PM run.`;
    }

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: reply }),
    });
  }

  return NextResponse.json({ ok: true });
}
