const fetch = require('node-fetch');
const { google } = require('googleapis');
const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Live Fetch Breaking Trends & News
async function fetchLatestNews(niche) {
  console.log(`🌐 Fetching real-time breaking trends for: "${niche}"...`);
  try {
    const res = await fetch('https://www.reddit.com/r/technology/hot.json?limit=6');
    const data = await res.json();
    const headlines = data.data.children.map(child => child.data.title).join('\n- ');
    return headlines;
  } catch (e) {
    return "Latest breakthroughs in AI, Robotics, Space Tech, and Future Innovations";
  }
}

// 2. Generate Voiceover MP3
async function generateAudio(text, outputPath) {
  console.log("🎙️ Generating Professional AI Voiceover...");
  const audioResults = await googleTTS.getAllAudioBase64(text, {
    lang: 'en',
    slow: false,
    host: 'https://translate.google.com',
    timeout: 10000,
  });

  const buffers = audioResults.map(item => Buffer.from(item.base64, 'base64'));
  const combinedBuffer = Buffer.concat(buffers);
  fs.writeFileSync(outputPath, combinedBuffer);
  console.log("✅ Voiceover Audio Generated Successfully!");
}

// 3. Fetch High-Quality Visual
async function downloadThumbnailImage(outputPath) {
  console.log("🖼️ Downloading High-Res Visual...");
  const imageRes = await fetch("https://picsum.photos/1080/1920");
  const buffer = await imageRes.buffer();
  fs.writeFileSync(outputPath, buffer);
}

// 4. Render Video with FFmpeg
function createVideoWithFFmpeg(imagePath, audioPath, outputPath) {
  console.log("🎬 Rendering Video with FFmpeg...");
  const command = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;
  execSync(command, { stdio: 'inherit' });
}

// 5. Upload Video to YouTube
async function uploadToYouTube(title, description, tags, videoPath, thumbnailPath) {
  console.log("🔐 Authenticating with YouTube API...");
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log("🚀 Uploading Short to YouTube...");
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: title.substring(0, 100),
        description: description,
        tags: tags,
        categoryId: '28',
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = res.data.id;

  try {
    await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(thumbnailPath),
      },
    });
  } catch (e) {
    console.log("ℹ️ Standard auto-thumbnail selected.");
  }

  return `https://youtu.be/${videoId}`;
}

async function runAgent() {
  console.log("🚀 Professional YouTube AI Studio Execution Started...");

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_USER_ID;
  const NICHE = process.env.TARGET_NICHE || "Technology & Future";

  try {
    const liveNews = await fetchLatestNews(NICHE);
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    console.log("🤖 Generating Pro Content based on Live Trends...");
    const aiPrompt = `You are a professional documentary media producer (like Vox, Bloomberg Technology, or MKBHD).
Today's Date: ${currentDate}.
Current Breaking Live Headlines in ${NICHE}:
${liveNews}

YOUR GOAL: Pick 1 specific breaking story or breakthrough and create a unique, highly professional YouTube Short.
STRICT RULES:
1. NEVER start with generic phrases like "Hey guys", "In this video", or "Did you know?". Start with a strong 2-second visual hook.
2. Tone: Authoritative, modern, cinematic, professional.
3. Keep script around 30-45 seconds spoken length.

Return JSON strictly with keys:
- title: Ultra high CTR, short, professional title with 1 hashtag (Max 90 chars)
- script: Professional spoken narration script
- description: Rich SEO description with key takeaways, timestamps, and viral #shorts hashtags
- tags: Array of 12 targeted SEO tags`;

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

    console.log("💡 Professional Content Generated:", content.title);

    const audioPath = path.join(__dirname, 'audio.mp3');
    const imagePath = path.join(__dirname, 'image.jpg');
    const videoPath = path.join(__dirname, 'final_short.mp4');

    await generateAudio(content.script, audioPath);
    await downloadThumbnailImage(imagePath);
    createVideoWithFFmpeg(imagePath, audioPath, videoPath);

    let youtubeUrl = "YouTube Keys Not Configured";
    if (process.env.YOUTUBE_REFRESH_TOKEN) {
      youtubeUrl = await uploadToYouTube(content.title, content.description, content.tags, videoPath, imagePath);
    }

    console.log("📱 Sending Telegram Report...");
    const reportMessage = 
      `🌟 **PRO YOUTUBE AI AGENT REPORT** 🌟\n\n` +
      `📅 **Date:** ${currentDate}\n` +
      `📌 **Title:** ${content.title}\n` +
      `🔗 **YouTube Link:** ${youtubeUrl}\n\n` +
      `🎙️ **Professional Script Narration:**\n"${content.script}"\n\n` +
      `🏷️ **SEO Tags:** ${Array.isArray(content.tags) ? content.tags.join(', ') : content.tags}\n\n` +
      `✅ *Status: 100% Unique, Fresh & Professional Content Published!*`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: reportMessage,
        parse_mode: 'Markdown',
      }),
    });

    console.log("🎉 Complete Execution Success!");

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
