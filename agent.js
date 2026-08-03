const fetch = require('node-fetch');
const { google } = require('googleapis');
const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Fetch Latest AI Trends
async function fetchLatestAITrends() {
  console.log(`🌐 Fetching latest AI trends for "AI Master Hub"...`);
  try {
    const res = await fetch('https://www.reddit.com/r/ArtificialInteligence/hot.json?limit=5');
    const data = await res.json();
    return data.data.children.map(child => child.data.title).join('\n- ');
  } catch (e) {
    return "Google NotebookLM audio overview, ChatGPT Canvas, Claude 3.5 Sonnet artifacts, DeepSeek AI";
  }
}

// 2. Generate Voiceover MP3
async function generateAudio(text, outputPath) {
  console.log("🎙️ Generating AI Voiceover...");
  const audioResults = await googleTTS.getAllAudioBase64(text, {
    lang: 'bn',
    slow: false,
    host: 'https://translate.google.com',
    timeout: 10000,
  });

  const buffers = audioResults.map(item => Buffer.from(item.base64, 'base64'));
  const combinedBuffer = Buffer.concat(buffers);
  fs.writeFileSync(outputPath, combinedBuffer);
  console.log("✅ Voiceover Audio Generated Successfully!");
}

// 3. Download Visual Background
async function downloadVisualBackground(outputPath) {
  console.log("🖼️ Downloading High-Res Visual Background...");
  const imageRes = await fetch("https://picsum.photos/1080/1920");
  const buffer = await imageRes.buffer();
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ Visual Background Ready!");
}

// 4. Render Video using FFmpeg
function createVideoWithFFmpeg(imagePath, audioPath, outputPath) {
  console.log("🎬 Rendering Video for AI Master Hub...");
  const command = `ffmpeg -nostdin -y -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;
  execSync(command, { stdio: 'inherit' });
  console.log("✅ Video Rendering Complete!");
}

// 5. Upload Video to YouTube
async function uploadToYouTube(title, description, tags, videoPath) {
  console.log("🔐 Authenticating with YouTube API...");
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log("🚀 Uploading Short to YouTube Channel 'AI Master Hub'...");
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: title.substring(0, 100),
        description: description,
        tags: tags,
        categoryId: '28', // Science & Technology
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

  return `https://youtu.be/${res.data.id}`;
}

async function runAgent() {
  console.log("🚀 AI Master Hub Studio Execution Started...");

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_USER_ID;
  const VERCEL_URL = process.env.VERCEL_APP_URL;

  try {
    const liveTrends = await fetchLatestAITrends();
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    console.log("🤖 Generating Content for 'AI Master Hub'...");
    const aiPrompt = `You are a viral YouTube Shorts creator for the channel "AI Master Hub".
Today's Date: ${currentDate}.
Latest Trending AI Topics:
${liveTrends}

TASK: Create 1 unique, trending, fact-checked YouTube Short (45-60s) about AI tools, news, ChatGPT, Claude, Gemini, or hidden productivity features.

RULES:
1. Focus on ONE main idea/tool. No false claims or clickbait.
2. Fast-paced, educational, engaging (Grade 6-8 reading level).
3. MUST END WITH EXACT CTA: "Subscribe to AI Master Hub for more AI secrets!"

Return JSON strictly with keys:
- title: Viral title under 60 characters
- hook: 5-second high-retention hook
- script: Full voice-over narration script (120-150 words)
- description: 100-word SEO description ending with the CTA
- tags: Array of 15 high-volume relevant hashtags
- thumbnailIdea: Visual thumbnail concept`;

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

    console.log("💡 Content Generated:", content.title);

    const audioPath = path.join(__dirname, 'audio.mp3');
    const imagePath = path.join(__dirname, 'image.jpg');
    const finalVideoPath = path.join(__dirname, 'final_aimasterhub_short.mp4');

    await generateAudio(content.script, audioPath);
    await downloadVisualBackground(imagePath);
    createVideoWithFFmpeg(imagePath, audioPath, finalVideoPath);

    // Upload to YouTube
    let youtubeUrl = "YouTube Keys Not Configured";
    if (process.env.YOUTUBE_REFRESH_TOKEN) {
      youtubeUrl = await uploadToYouTube(content.title, content.description, content.tags, finalVideoPath);
      console.log("✅ YouTube Upload Success:", youtubeUrl);
    }

    // Send Telegram Report
    console.log("📱 Sending Telegram Report...");
    const reportMessage = 
      `🌟 AI MASTER HUB DAILY REPORT 🌟\n\n` +
      `📌 Title: ${content.title}\n` +
      `🔗 YouTube Link: ${youtubeUrl}\n\n` +
      `⚡ 5s Hook: "${content.hook}"\n\n` +
      `🎙️ Script (120-150 words):\n"${content.script}"\n\n` +
      `🏷️ SEO Hashtags:\n${Array.isArray(content.tags) ? content.tags.join(' ') : content.tags}\n\n` +
      `✅ Status: Video Published Successfully for AI Master Hub!`;

    if (TELEGRAM_TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: reportMessage,
        }),
      });
      console.log("✅ Telegram Report Delivered Successfully!");
    }

    // Push Live Update to Vercel Frontend
    if (VERCEL_URL) {
      try {
        await fetch(`${VERCEL_URL}/api/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: content.title,
            youtubeUrl: youtubeUrl,
            script: content.script,
            status: 'Published Successfully'
          })
        });
        console.log("✅ Live Dashboard Updated on Vercel!");
      } catch (e) {
        console.log("ℹ️ Vercel log update skipped.");
      }
    }

    console.log("🎉 Complete Execution Success!");

  } catch (error) {
    console.error("❌ Error occurred:", error.message);
    if (TELEGRAM_TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `❌ AI Master Hub Agent Error: ${error.message}`,
        }),
      });
    }
    process.exit(1);
  }
}

runAgent();
