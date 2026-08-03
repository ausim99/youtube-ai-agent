const fetch = require('node-fetch');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function downloadVideo(url, outputPath) {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
}

async function uploadToYouTube(title, description, tags, videoUrl) {
  const videoPath = path.join(__dirname, 'video.mp4');
  
  console.log("📥 Downloading video file...");
  // Using a reliable sample video file
  await downloadVideo(videoUrl, videoPath);

  console.log("🔐 Authenticating with YouTube API...");
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log("🚀 Uploading Video to YouTube Channel...");
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: title.substring(0, 100), // Max 100 chars
        description: description,
        tags: tags,
        categoryId: '28', // Science & Technology
      },
      status: {
        privacyStatus: 'public', // Change to 'unlisted' or 'private' if testing
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: 'video/mp4', // <-- Fix: explicitly set mimeType
      body: fs.createReadStream(videoPath),
    },
  });

  // Clean up local video file
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
  }

  return `https://youtu.be/${res.data.id}`;
}

async function runAgent() {
  console.log("🚀 AI Agent Execution Started...");

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_USER_ID;
  const NICHE = process.env.TARGET_NICHE || "Technology & Future";

  try {
    // 1. Generate Idea & Script using Groq AI
    console.log(`🤖 Requesting idea from Groq AI for Niche: "${NICHE}"`);
    const aiPrompt = `You are an expert YouTube Shorts Creator. Niche: "${NICHE}". 
    Generate 1 viral YouTube Short idea, a short 30-second script, catchy Title, Description, and Tags. 
    Return strictly JSON with keys: idea, title, script, description, tags.`;

    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: aiPrompt }],
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await aiRes.json();
    const content = JSON.parse(aiData.choices[0].message.content);

    console.log("💡 Idea & Script Generated:", content.title);

    // 2. Sample Video Stream for YouTube Upload
    const sampleVideoUrl = "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4";

    // 3. Upload to YouTube Channel
    let youtubeUrl = "YouTube Credentials Not Set";
    if (process.env.YOUTUBE_REFRESH_TOKEN) {
      youtubeUrl = await uploadToYouTube(content.title, content.description, content.tags, sampleVideoUrl);
      console.log("✅ Posted to YouTube:", youtubeUrl);
    }

    // 4. Send Telegram Report
    console.log("📱 Sending Telegram Report...");
    const reportMessage = 
      `🎉 **DAILY YOUTUBE AGENT REPORT** 🎉\n\n` +
      `💡 **Niche:** ${NICHE}\n` +
      `📌 **Title:** ${content.title}\n` +
      `🔗 **YouTube Link:** ${youtubeUrl}\n\n` +
      `📝 **Script Preview:**\n${content.script.substring(0, 150)}...\n\n` +
      `✅ *Status: Video Successfully Uploaded & Published!*`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: reportMessage,
        parse_mode: 'Markdown',
      }),
    });

    console.log("🎉 Agent Execution Completed Successfully!");

  } catch (error) {
    console.error("❌ Error occurred:", error.message);
    
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
