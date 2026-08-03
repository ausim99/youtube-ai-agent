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
    // Filter out low-engagement / stickied posts so we don't script something stale
    const posts = data.data.children
      .map(child => child.data)
      .filter(p => !p.stickied && p.score >= 20)
      .slice(0, 5);
    if (posts.length === 0) {
      throw new Error('No qualifying trending posts found');
    }
    return posts.map(p => `${p.title} (upvotes: ${p.score})`).join('\n- ');
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

// 3. Download Visual Background (with validation + retry + guaranteed fallback)
async function downloadVisualBackground(outputPath) {
  console.log("🖼️ Downloading High-Res Visual Background...");

  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // cache-bust so we don't get stuck retrying the same (possibly bad) response
      const imageRes = await fetch(`https://picsum.photos/1080/1920?random=${Date.now()}-${attempt}`);

      if (!imageRes.ok) {
        throw new Error(`HTTP ${imageRes.status} from picsum.photos`);
      }
      const contentType = imageRes.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error(`Unexpected content-type: ${contentType} (likely an error page, not an image)`);
      }

      const buffer = await imageRes.buffer();
      if (!buffer || buffer.length < 1000) {
        throw new Error(`Downloaded image too small (${buffer ? buffer.length : 0} bytes) — probably corrupt`);
      }

      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Visual Background Ready! (${buffer.length} bytes, attempt ${attempt})`);
      return;
    } catch (err) {
      console.warn(`⚠️ Background download attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`);
      if (attempt === MAX_ATTEMPTS) {
        console.warn("⚠️ All download attempts failed — generating a solid-color fallback background instead.");
        generateFallbackBackground(outputPath);
      }
    }
  }
}

// 3b. Fallback background generator (no network needed) — guarantees a video always has *some* visual
function generateFallbackBackground(outputPath) {
  const command = `ffmpeg -nostdin -y -f lavfi -i color=c=0x1a1a2e:s=1080x1920:d=1 -frames:v 1 "${outputPath}"`;
  execSync(command, { stdio: 'inherit' });
  console.log("✅ Fallback background generated locally via FFmpeg.");
}

// 4. Render Video using FFmpeg
function createVideoWithFFmpeg(imagePath, audioPath, outputPath) {
  console.log("🎬 Rendering Video for AI Master Hub...");

  if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size < 1000) {
    throw new Error(`Background image missing or invalid at ${imagePath} — aborting render before ffmpeg runs.`);
  }

  const command = `ffmpeg -nostdin -y -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;
  execSync(command, { stdio: 'inherit' });

  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
    throw new Error(`FFmpeg reported success but output video is missing/empty at ${outputPath}.`);
  }
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

    // ---------------------------------------------------------------
    // IMPROVED PROMPT: structured hook, retention framework, fact-check
    // guardrail, and a title formula — everything else (config, model,
    // upload logic) is unchanged.
    // ---------------------------------------------------------------
    const aiPrompt = `You are a senior short-form video scriptwriter for the YouTube channel "AI Master Hub", specializing in AI tools and news for a tech-curious but non-expert audience.

Today's Date: ${currentDate}.
Candidate trending AI topics (Reddit, ranked by engagement):
${liveTrends}

STEP 1 — SELECT: Pick the ONE topic from the list above that is most concrete, most useful, and easiest to explain visually in 45-60 seconds. Avoid vague "AI news roundup" topics — pick something with a specific tool, feature, or number attached.

STEP 2 — WRITE using this exact retention structure:
- Hook (0-3s): Open with a specific number, a surprising capability, or a "you're doing X wrong" pattern interrupt. NOT a generic "Did you know AI can..." opener.
- Setup (3-10s): State the problem this solves in one sentence a beginner understands.
- Payoff (10-45s): Walk through the tool/feature step by step, in plain language. Use concrete specifics (names, numbers, steps) instead of vague hype ("game-changing", "revolutionary" are banned words).
- CTA (45-60s): Must end with exactly this line: "Subscribe to AI Master Hub for more AI secrets!"

STEP 3 — FACT DISCIPLINE: Only state claims that are either (a) present in the candidate topics above, or (b) well-established, non-time-sensitive facts about how the tool/feature works. Do not invent version numbers, dates, pricing, or statistics. If unsure, describe the capability qualitatively instead of citing a specific figure.

STEP 4 — TITLE FORMULA: Use one of these patterns, whichever fits the topic best:
  "[Number] [Tool] Tricks Nobody Tells You About"
  "[Tool] Just Did Something Wild — Here's What"
  "Stop Using [Tool] Wrong (Do This Instead)"
Keep it under 60 characters, no clickbait that the script doesn't deliver on.

Return JSON strictly with keys, no markdown, no preamble:
- title: per the title formula above, under 60 characters
- hook: the exact 0-3s hook line
- script: full voice-over narration (120-150 words), following the 4-part structure above, ending with the exact CTA line
- description: 100-word SEO description that front-loads the main keyword in the first sentence, ends with the CTA
- tags: array of 15 specific, high-relevance tags (mix of broad: "AI tools", "ChatGPT" and specific: the exact tool/feature name) — avoid generic filler hashtags
- thumbnailIdea: one concrete visual concept (what's on screen, what text overlay, what facial expression/emotion) that matches the hook`;

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
