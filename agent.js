const fetch = require('node-fetch');

async function runAgent() {
  console.log("🚀 AI Agent Execution Started...");

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_USER_ID;
  const NICHE = process.env.TARGET_NICHE || "Technology & Future";

  try {
    // Check if API key is present
    if (!OPENAI_KEY) {
      throw new Error("OPENAI_API_KEY is missing from GitHub Secrets!");
    }

    console.log(`🤖 Requesting idea from OpenAI for Niche: "${NICHE}"`);
    
    const aiPrompt = `You are an expert YouTube Creator. Niche: "${NICHE}". 
    Generate 1 viral YouTube Short idea, a 30-second script, Title, and Hashtags. 
    Return strictly JSON format with keys: idea, title, script, hashtags.`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for maximum speed and lowest cost
        messages: [{ role: 'user', content: aiPrompt }],
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await aiRes.json();

    // Check if OpenAI returned an API Error
    if (aiData.error) {
      throw new Error(`OpenAI API Error: ${aiData.error.message}`);
    }

    const content = JSON.parse(aiData.choices[0].message.content);

    console.log("💡 Idea Generated:", content.title);

    // Send Telegram Report
    console.log("📱 Sending Telegram Report...");
    const reportMessage = 
      `✅ **DAILY YOUTUBE AGENT REPORT**\n\n` +
      `💡 **Niche:** ${NICHE}\n` +
      `📌 **Title:** ${content.title}\n` +
      `📝 **Script Preview:** ${content.script.substring(0, 150)}...\n\n` +
      `🚀 **Status:** Idea & Script Successfully Generated!`;

    const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: reportMessage,
        parse_mode: 'Markdown',
      }),
    });

    const telegramData = await telegramRes.json();
    if (!telegramData.ok) {
      throw new Error(`Telegram API Error: ${telegramData.description}`);
    }

    console.log("🎉 Agent Work Complete! Telegram Report Sent.");

  } catch (error) {
    console.error("❌ Error occurred:", error.message);
    
    // Attempt to notify user on Telegram about failure
    if (TELEGRAM_TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `❌ **Agent Execution Failed!**\n\nReason: ${error.message}`,
        }),
      });
    }

    process.exit(1);
  }
}

runAgent();
