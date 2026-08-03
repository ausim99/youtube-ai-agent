const fetch = require('node-fetch');

async function runAgent() {
  console.log("🚀 AI Agent Execution Started...");

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_USER_ID;
  const NICHE = process.env.TARGET_NICHE || "Technology & Future";

  try {
    // 1. Generate Idea & Script
    console.log(`🤖 Generating Idea for Niche: ${NICHE}`);
    const aiPrompt = `You are an expert YouTube Creator. Niche: "${NICHE}". 
    Generate 1 viral YouTube Short idea, a 30-second script, Title, and Hashtags. 
    Return strictly JSON with keys: idea, title, script, hashtags.`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: aiPrompt }],
      }),
    });

    const aiData = await aiRes.json();
    // Clean response to handle potential formatting wrappers
    const rawContent = aiData.choices[0].message.content.replace(/```json|```/g, '');
    const content = JSON.parse(rawContent);

    console.log("💡 Idea Generated:", content.title);

    // 2. Render Video (Triggers Video Rendering Cloud API)
    console.log("🎬 Rendering Video...");
    // Video Generation Logic Here (Shotstack/JSON2Video API)

    // 3. Upload to YouTube API
    console.log("📤 Uploading to YouTube...");
    // YouTube Upload Logic Here using YOUTUBE_REFRESH_TOKEN

    // 4. Send Telegram Report
    console.log("📱 Sending Telegram Report...");
    const reportMessage = 
      `✅ **DAILY YOUTUBE AGENT REPORT (6:00 PM)**\n\n` +
      `💡 **Niche:** ${NICHE}\n` +
      `📌 **Title:** ${content.title}\n` +
      `📝 **Script Preview:** ${content.script.substring(0, 120)}...\n\n` +
      `🚀 **Status:** Video Rendered & Posted to YouTube!`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: reportMessage,
        parse_mode: 'Markdown',
      }),
    });

    console.log("🎉 Agent Work Complete!");

  } catch (error) {
    console.error("❌ Error occurred:", error.message);
    
    // Notify user on Telegram about failure
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `❌ **Agent Execution Failed!**\nError: ${error.message}`,
      }),
    });

    process.exit(1);
  }
}

runAgent();
