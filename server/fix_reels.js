const mongoose = require('mongoose');
require('dotenv').config();
const Reel = require('./src/models/Reel');

const mockVideos = [
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

async function update() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snapgram');
  const reels = await Reel.find({});
  let i = 0;
  for (const r of reels) {
    if (r.video && r.video.url && r.video.url.includes('pexels.com')) {
       r.video.url = mockVideos[i % mockVideos.length];
       await r.save();
       i++;
    }
  }
  console.log(`Updated ${i} reels.`);
  process.exit(0);
}

update().catch(console.error);
