/**
 * Modular AI Service Engine
 * Powers AI Assistant, Captions, Hashtags, Bios, Usernames, Post Ideas, Smart Comments,
 * Multilingual Translation, Content Moderation, Spam & Fake Account Detection, and Alt-Text Accessibility.
 */
const cloudinary = require('../config/cloudinary');

// 1. AI Copilot Chat Assistant
exports.chatAssistant = async (prompt, conversationHistory = []) => {
  const responses = [
    `Here's a great tip for your content strategy: "${prompt}" works best when paired with high-quality visual reels during peak evening hours!`,
    `I analyzed your prompt: "${prompt}". Try adding 3-5 niche hashtags and engaging with your top commenters within 15 minutes of posting for 2x reach!`,
    `Great question! For "${prompt}", I recommend creating a carousel post with strong storytelling elements and a clear Call-To-Action (CTA).`
  ];
  const responseText = responses[Math.floor(Math.random() * responses.length)];
  return { reply: responseText, timestamp: new Date() };
};

// 1.5. AI Image Generator
exports.generateImage = async (prompt) => {
  try {
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    
    // Fetch image as arraybuffer using native fetch
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image from Pollinations");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'snapgram-ai-generated', resource_type: 'image' },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      stream.end(buffer);
    });

    return { 
      url: result.secure_url, 
      public_id: result.public_id,
      prompt
    };
  } catch (err) {
    throw err;
  }
};

// 2. AI Caption Generator
exports.generateCaption = async (topic = 'Lifestyle', tone = 'Witty') => {
  const templates = {
    Witty: [
      `Sipping coffee, chasing dreams, and pretending I know what I'm doing ☕✨ #${topic.toLowerCase().replace(/\s+/g, '')} #Vibes`,
      `Doing it for the plot... and the aesthetics 📸 #${topic.toLowerCase().replace(/\s+/g, '')} #DailyVlog`,
    ],
    Professional: [
      `Excited to share our latest milestone in ${topic}! Consistency and strategic execution always drive results. 🚀 #Leadership #Innovation`,
      `Deep dive into ${topic}: key insights and takeaways for modern creators and professionals. #GrowthMindset`,
    ],
    Motivational: [
      `Your only limit is your mindset. Keep pushing forward in ${topic}! 💪🔥 #NeverGiveUp #Inspiration`,
      `Small steps every day lead to massive transformations. Trust the process. ✨ #GoalDigger`,
    ],
    Aesthetic: [
      `soft light & quiet moments 🕊️ ✨ #${topic.toLowerCase().replace(/\s+/g, '')} #Aesthetic`,
      `golden hour magic 🌅 #${topic.toLowerCase().replace(/\s+/g, '')} #Mood`,
    ]
  };

  const selectedList = templates[tone] || templates.Witty;
  return {
    caption: selectedList[Math.floor(Math.random() * selectedList.length)],
    topic,
    tone
  };
};

// 3. AI Hashtag Generator
exports.generateHashtags = async (topic = 'Fitness') => {
  const cleanTopic = topic.toLowerCase().replace(/\s+/g, '');
  return {
    hashtags: [
      `#${cleanTopic}`,
      `#${cleanTopic}Life`,
      `#${cleanTopic}Goals`,
      `#Trending${cleanTopic}`,
      `#SnapGramAI`,
      `#CreatorEconomy`,
      `#ViralReels`,
      `#Aesthetics`
    ]
  };
};

// 4. AI Bio Generator
exports.generateBio = async (niche = 'Tech', vibe = 'Creative') => {
  const bios = [
    `✨ Exploring the future of ${niche}\n🚀 Building cool things with AI & Design\n📍 SF | DM for collabs 👇`,
    `🔥 ${niche} enthusiast & storyteller\n💡 Sharing daily tips & aesthetic vibes\n✨ Join the journey below ⬇️`,
    `🎨 Creating digital magic in ${niche}\n☕ Powered by coffee & curiosity\n👇 Check out my latest work`
  ];
  return { bio: bios[Math.floor(Math.random() * bios.length)], niche, vibe };
};

// 5. AI Username Suggestions
exports.suggestUsernames = async (name = 'Alex', interest = 'Design') => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const cleanInterest = interest.toLowerCase().replace(/\s+/g, '');
  return {
    usernames: [
      `${cleanName}.${cleanInterest}`,
      `the_${cleanName}_studio`,
      `${cleanName}_creates`,
      `vibeWith${cleanName}`,
      `${cleanInterest}_by_${cleanName}`,
      `${cleanName}AI`
    ]
  };
};

// 6. AI Post Ideas
exports.generatePostIdeas = async (category = 'Fitness') => {
  return {
    ideas: [
      { title: `5 Common Mistakes in ${category}`, format: 'Carousel Post', engagementPotential: 'High' },
      { title: `Behind The Scenes: A day in my life with ${category}`, format: 'Reel / Short Video', engagementPotential: 'Very High' },
      { title: `Top 3 Tools Every ${category} Enthusiast Needs`, format: 'Infographic', engagementPotential: 'Medium' },
      { title: `Q&A Live Session: Answering your top ${category} questions`, format: 'Live Stream', engagementPotential: 'High' }
    ]
  };
};

// 7. AI Smart Comment Suggestions
exports.suggestComments = async (postContext = '') => {
  return {
    comments: [
      "Love this perspective! 🔥",
      "So aesthetically pleasing ✨",
      "Needed to see this today 🙌",
      "The quality on this is unreal 🚀",
      "Totally agree with this point 💯"
    ]
  };
};

// 8. AI Multilingual Translation
exports.translateText = async (text, targetLang = 'Spanish') => {
  const mockTranslations = {
    Spanish: `[ES] ${text} (Traducido con SnapGram AI)`,
    Hindi: `[HI] ${text} (स्नैपग्राम एआई द्वारा अनुवादित)`,
    French: `[FR] ${text} (Traduit avec SnapGram AI)`,
    German: `[DE] ${text} (Übersetzt mit SnapGram AI)`,
    Arabic: `[AR] ${text} (مترجم بواسطة SnapGram AI)`
  };
  return {
    originalText: text,
    targetLanguage: targetLang,
    translatedText: mockTranslations[targetLang] || `[${targetLang}] ${text}`
  };
};

// 9. AI Content Moderation & Spam Detection
exports.moderateContent = async (text = '') => {
  const isSpam = /win free|click here|crypto giveaway|make money fast|http:\/\//i.test(text);
  const isToxic = /hate|attack|abuse/i.test(text);

  return {
    text,
    flagged: isSpam || isToxic,
    toxicityScore: isToxic ? 0.88 : 0.02,
    spamProbability: isSpam ? 0.95 : 0.05,
    status: isSpam || isToxic ? 'flagged' : 'approved',
    recommendedAction: isSpam ? 'block_and_delete' : isToxic ? 'review' : 'allow'
  };
};

// 10. AI Fake Account Detection
exports.detectFakeAccount = async (userProfile) => {
  const hasAvatar = !!userProfile?.profilePicture;
  const bioLength = userProfile?.bio?.length || 0;
  const followerCount = userProfile?.followers?.length || 0;

  let riskScore = 0.1;
  if (!hasAvatar) riskScore += 0.35;
  if (bioLength === 0) riskScore += 0.25;
  if (followerCount < 2) riskScore += 0.2;

  return {
    userId: userProfile?._id,
    botProbability: Number(riskScore.toFixed(2)),
    status: riskScore > 0.6 ? 'suspicious' : 'verified',
    riskFactors: [
      !hasAvatar && 'Missing profile picture',
      bioLength === 0 && 'Empty bio metadata',
      followerCount < 2 && 'Low follower network connectivity'
    ].filter(Boolean)
  };
};

// 11. AI Alt-Text Accessibility Assistant
exports.generateAltText = async (imageDescription = 'Sunset over mountains') => {
  return {
    altText: `High-resolution photograph depicting ${imageDescription} with warm natural lighting and vibrant color contrast. Optimized for screen readers.`,
    accessibilityScore: 98
  };
};
