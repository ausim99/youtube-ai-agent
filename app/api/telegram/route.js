import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text.trim();

      const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const GITHUB_PAT = process.env.GH_PAT;
      const REPO_OWNER = process.env.GH_OWNER;
      const REPO_NAME = process.env.GH_REPO || 'youtube-ai-agent';

      let responseText = "";

      if (text.startsWith('/run') || text.startsWith('/generate') || text.startsWith('/start')) {
        responseText = "🚀 Command received! Triggering YouTube AI Agent on GitHub. Generating and uploading video now...";

        // Trigger GitHub Actions Workflow via API
        const ghRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/daily-agent.yml/dispatches`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_PAT}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Vercel-Telegram-Bot'
          },
          body: JSON.stringify({
            ref: 'main', // Branch name
          }),
        });

        if (!ghRes.ok) {
          responseText = "❌ Failed to trigger GitHub Action. Please check your GH_PAT token in Vercel.";
        }
      } else {
        responseText = `🤖 Hello! Send **/run** to generate and publish a new YouTube Short right now!`;
      }

      // Send confirmation message back to Telegram
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: responseText, parse_mode: 'Markdown' }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
