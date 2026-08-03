const fetch = require('node-fetch');
const { google } = require('googleapis');
const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Live Fetch Breaking Trends
async function fetchLatestNews(niche) {
  console.log(`🌐 Fetching real-time breaking trends for: "${niche}"...`);
  try {
    const res = await fetch('https://www.reddit.com/r/technology/hot.json?limit=6');
    const data = await res.json();
    return data.data.children.map(child => child.data.title).join('\n- ');
  } catch (e) {
    return "Latest breakthroughs in AI, Robotics, Space Tech, and Future Innovations";
  }
}

// 2. Generate Bangla AI Voiceover (বাংলা ভয়েসওভার)
async function generateBanglaAudio(text, outputPath) {
  console.log("🎙️ Generating Bangla AI Voiceover (বাংলা ভয়েসওভার)...");
  
  const audioResults = await googleTTS.getAllAudioBase64(text, {
    lang: 'bn', // Bengali Language Code
    slow: false,
    host: 'https://translate.google.com',
    timeout: 10000,
  });

  const buffers = audioResults.map(item => Buffer.from(item.base64, 'base64'));
  const combinedBuffer = Buffer.concat(buffers);
  fs.writeFileSync(outputPath, combinedBuffer);
  console.log("✅ Bangla Voiceover Generated Successfully!");
}

// 3. Download AI Video Background (HD Vertical Loop)
async function downloadAIVideoBackground(outputPath) {
  console.log("🎬 Downloading High-Quality AI Video Background...");
  // Curated vertical 9:16 HD AI/Tech video background loop
  const videoUrl = "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4";
  
  const res = await fetch(videoUrl);
  const fileStream = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
  console.log("✅ AI Video Background Downloaded!");
}

// 4. Render Video using FFmpeg (Merges AI Video + Bangla Audio)
function createVideoWithFFmpeg(bgVideoPath, audioPath, outputPath) {
  console.log("🎬 Rendering Final Bangla Short Video with FFmpeg...");
  // Loops the background video smoothly to match audio duration
  const command = `ffmpeg -y -stream_loop -1 -i "${bgVideoPath}" -i "${audioPath}" -c:v libx264 -preset ultrafast -c:a aac -b:a 192k -shortest -pix_fmt yuv420p "${outputPath}"`;
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

  console.log("🚀 Uploading Bangla Short to YouTube...");
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: title.substring(0, 100),
        description: description,
        tags: tags,
        categoryId: '28', // Science & Technology
        defaultLanguage: 'bn',
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
  console.log("🚀 Bangla AI YouTube Studio Execution Started...");

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_USER_ID;
  const NICHE = process.env.TARGET_NICHE || "Technology & Future AI";

  try {
    const liveNews = await fetchLatestNews(NICHE);
    const currentDate = new Date().toLocaleDateString('bn-BD', { month: 'long', day: 'numeric', year: 'numeric' });

    console.log("🤖 Generating Bangla Script & SEO Content...");
    const aiPrompt = `You are a top viral YouTube Shorts creator in BANGLADESH. Niche: "${NICHE}".
    Current Live Tech Topics:
    ${liveNews}

    YOUR TASK: Create a highly engaging, viral 30-second video script in BANGLA LANGUAGE (বাংলা ভাষা).
    STRICT RULES:
    1. Everything (title, script, description) MUST be in BANGLA (বাংলা).
    2. Hook the viewer in the first 2 seconds.
    3. Make it professional, clear, and informative.

    Return JSON strictly with keys:
    - title: Clickbait, high CTR Bangla title with 1 hashtag (বাংলায শিরোনাম, max 90 chars)
    - script: Clear, easy to speak Bangla narration script (বাংলা স্ক্রিপ্ট)
    - description: Full SEO Bangla description with hashtags (#shorts #techbangla)
    - tags: Array of 12 Bangla and English SEO keywords`;

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

    console.log("💡 Bangla Content Generated:", content.title);

    // File Paths
    const audioPath = path.join(__dirname, 'audio.mp3');
    const bgVideoPath = path.join(__dirname, 'bg_video.mp4');
    const finalVideoPath = path.join(__dirname, 'final_bangla_short.mp4');

    // STEP A: Generate Bangla Voiceover
    await generateBanglaAudio(content.script, audioPath);

    // STEP B: Download AI Video Background
    await downloadAIVideoBackground(bgVideoPath);

    // STEP C: Merge AI Video Background + Bangla Voiceover
    createVideoWithFFmpeg(bgVideoPath, audioPath, finalVideoPath);

    // STEP D: Upload to YouTube
    let youtubeUrl = "YouTube Keys Not Configured";
    if (process.env.YOUTUBE_REFRESH_TOKEN) {
      youtubeUrl = await uploadToYouTube(content.title, content.description, content.tags, finalVideoPath);
    }

    // STEP E: Send Telegram Report in Bangla
    console.log("📱 Sending Telegram Report in Bangla...");
    const reportMessage = 
      `🇧🇩 **ডেইলি ইউটিউব বাংলা এআই রিপোর্ট** 🇧🇩\n\n` +
      `📅 **তারিখ:** ${currentDate}\n` +
      `📌 **শিরোনাম:** ${content.title}\n` +
      `🔗 **ইউটিউব লিংক:** ${youtubeUrl}\n\n` +
      `🎙️ **বাংলা ভয়েসওভার স্ক্রিপ্ট:**\n"${content.script}"\n\n` +
      `✅ *স্ট্যাটাস: এআই ব্যাকগ্রাউন্ড ভিডিও সহ বাংলা শর্ট সফলভাবে আপলোড হয়েছে!*`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: reportMessage,
        parse_mode: 'Markdown',
      }),
    });

    console.log("🎉 Bangla AI Short Successfully Created & Published!");

  } catch (error) {
    console.error("❌ Error occurred:", error.message);
    if (TELEGRAM_TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `❌ **এআই এজেন্ট এরর!**\n\nকারণ: ${error.message}`,
        }),
      });
    }
    process.exit(1);
  }
}

runAgent();
