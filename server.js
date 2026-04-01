require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// ===== SCHEMAS =====
const VideoSchema = new mongoose.Schema({
  section: String, // 'gamedev', 'animation', 'video'
  title: String,
  desc: String,
  url: String,
  createdAt: { type: Date, default: Date.now }
});

const ModelSchema = new mongoose.Schema({
  title: String,
  desc: String,
  url: String,
  createdAt: { type: Date, default: Date.now }
});

const ReviewSchema = new mongoose.Schema({
  name: String,
  role: String,
  text: String,
  stars: Number,
  createdAt: { type: Date, default: Date.now }
});

const DetailsSchema = new mongoose.Schema({
  key: { type: String, default: 'main' },
  org: String,
  tag: String,
  h1: String,
  h2: String,
  fn: String,
  email: String,
  phone: String,
  yt: String,
});

const AnalyticsSchema = new mongoose.Schema({
  eventType: String, // 'video_play', 'page_view', 'section_view', 'model_view', 'click', 'scroll', 'session'
  videoId: String,
  videoTitle: String,
  section: String,
  playStartTime: Date,
  playEndTime: Date,
  watchDuration: Number, // in seconds
  totalDuration: Number, // in seconds
  completionPercent: Number, // 0-100
  pageScrollDepth: Number, // 0-100%
  sessionDuration: Number, // total time on site in seconds
  clickTarget: String, // element clicked
  clickSection: String, // which section was clicked in
  modelId: String,
  modelTitle: String,
  userAgent: String,
  browser: String, // parsed browser name
  device: String, // 'mobile', 'tablet', 'desktop'
  referrer: String,
  ipHash: String, // anonymized IP
  sessionId: String, // to group events
  createdAt: { type: Date, default: Date.now }
});

const Video   = mongoose.model('Video', VideoSchema);
const Model3D = mongoose.model('Model3D', ModelSchema);
const Review  = mongoose.model('Review', ReviewSchema);
const Details = mongoose.model('Details', DetailsSchema);
const Analytics = mongoose.model('Analytics', AnalyticsSchema);

// ===== AUTH MIDDLEWARE =====
function auth(req, res, next) {
  const pw = req.headers['x-admin-password'];
  if (pw === process.env.ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ===== ROUTES =====

// -- GET all data (public) --
app.get('/api/data', async (req, res) => {
  try {
    const [videos, models, reviews, detailsDoc] = await Promise.all([
      Video.find().sort({ createdAt: 1 }),
      Model3D.find().sort({ createdAt: 1 }),
      Review.find().sort({ createdAt: 1 }),
      Details.findOne({ key: 'main' })
    ]);
    const sections = { gamedev: [], animation: [], video: [] };
    videos.forEach(v => { if (sections[v.section]) sections[v.section].push(v); });
    res.json({ ...sections, threed: models, reviews, details: detailsDoc || {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- ADD video --
app.post('/api/videos', auth, async (req, res) => {
  try {
    const v = await Video.create(req.body);
    res.json(v);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- DELETE video --
app.delete('/api/videos/:id', auth, async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- ADD 3D model --
app.post('/api/models', auth, async (req, res) => {
  try {
    const m = await Model3D.create(req.body);
    res.json(m);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- DELETE 3D model --
app.delete('/api/models/:id', auth, async (req, res) => {
  try {
    await Model3D.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- ADD review --
app.post('/api/reviews', auth, async (req, res) => {
  try {
    const r = await Review.create(req.body);
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- DELETE review --
app.delete('/api/reviews/:id', auth, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- SAVE details --
app.post('/api/details', auth, async (req, res) => {
  try {
    const d = await Details.findOneAndUpdate(
      { key: 'main' },
      { ...req.body, key: 'main' },
      { upsert: true, new: true }
    );
    res.json(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- AUTH CHECK --
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) res.json({ ok: true });
  else res.status(401).json({ error: 'Wrong password' });
});

// -- TRACK PAGE VIEW --
app.post('/api/analytics/page-view', async (req, res) => {
  try {
    const { page, sessionId } = req.body;
    const ua = req.headers['user-agent'] || '';
    const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 
                   ua.includes('Safari') ? 'Safari' : ua.includes('Edge') ? 'Edge' : 'Other';
    const device = ua.includes('Mobile') || ua.includes('Android') ? 'mobile' : 
                  ua.includes('Tablet') || ua.includes('iPad') ? 'tablet' : 'desktop';
    const ipHash = crypto.createHash('sha256').update(req.ip).digest('hex').substring(0, 8);
    
    const analytics = await Analytics.create({
      eventType: 'page_view',
      section: page,
      userAgent: ua,
      browser,
      device,
      referrer: req.headers['referer'] || 'direct',
      ipHash,
      sessionId: sessionId || crypto.randomBytes(8).toString('hex'),
      playStartTime: new Date(),
      playEndTime: new Date()
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- TRACK EVENTS --
app.post('/api/analytics/track', async (req, res) => {
  try {
    const {
      eventType, videoId, videoTitle, section, watchDuration, totalDuration,
      completionPercent, pageScrollDepth, sessionDuration, clickTarget, clickSection,
      modelId, modelTitle, sessionId
    } = req.body;
    
    // Parse user agent
    const ua = req.headers['user-agent'] || '';
    const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 
                   ua.includes('Safari') ? 'Safari' : ua.includes('Edge') ? 'Edge' : 'Other';
    const device = ua.includes('Mobile') || ua.includes('Android') ? 'mobile' : 
                  ua.includes('Tablet') || ua.includes('iPad') ? 'tablet' : 'desktop';
    
    // Simple IP hash (not storing actual IP)
    const ipHash = crypto.createHash('sha256').update(req.ip).digest('hex').substring(0, 8);
    
    const analytics = await Analytics.create({
      eventType,
      videoId,
      videoTitle,
      section,
      playStartTime: req.body.playStartTime ? new Date(req.body.playStartTime) : new Date(),
      playEndTime: new Date(),
      watchDuration: watchDuration || 0,
      totalDuration: totalDuration || 0,
      completionPercent: completionPercent || 0,
      pageScrollDepth: pageScrollDepth || 0,
      sessionDuration: sessionDuration || 0,
      clickTarget,
      clickSection,
      modelId,
      modelTitle,
      userAgent: ua,
      browser,
      device,
      referrer: req.headers['referer'] || 'direct',
      ipHash,
      sessionId: sessionId || crypto.randomBytes(8).toString('hex')
    });
    res.json({ ok: true, _id: analytics._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- GET DASHBOARD STATS (admin only) --
app.get('/api/analytics/dashboard', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));
    
    const allEvents = await Analytics.find({ createdAt: { $gte: dateFilter } });
    
    // Unique sessions
    const sessions = new Set(allEvents.map(e => e.sessionId)).size;
    
    // Device breakdown
    const deviceBreakdown = {};
    allEvents.forEach(e => {
      deviceBreakdown[e.device] = (deviceBreakdown[e.device] || 0) + 1;
    });
    
    // Browser breakdown
    const browserBreakdown = {};
    allEvents.forEach(e => {
      if (e.browser) browserBreakdown[e.browser] = (browserBreakdown[e.browser] || 0) + 1;
    });
    
    // Event type breakdown
    const eventBreakdown = {};
    allEvents.forEach(e => {
      eventBreakdown[e.eventType] = (eventBreakdown[e.eventType] || 0) + 1;
    });
    
    // Popular sections
    const sectionPopularity = {};
    allEvents.filter(e => e.section).forEach(e => {
      sectionPopularity[e.section] = (sectionPopularity[e.section] || 0) + 1;
    });
    
    // Top videos
    const videoStats = {};
    allEvents.filter(e => e.videoTitle).forEach(e => {
      if (!videoStats[e.videoTitle]) {
        videoStats[e.videoTitle] = { plays: 0, avgWatch: 0, avgCompletion: 0, section: e.section };
      }
      videoStats[e.videoTitle].plays++;
      videoStats[e.videoTitle].avgWatch += e.watchDuration || 0;
      videoStats[e.videoTitle].avgCompletion += e.completionPercent || 0;
    });
    
    Object.keys(videoStats).forEach(title => {
      const count = videoStats[title].plays;
      videoStats[title].avgWatch = Math.round(videoStats[title].avgWatch / count);
      videoStats[title].avgCompletion = Math.round(videoStats[title].avgCompletion / count);
    });
    
    // Average metrics
    const videoEvents = allEvents.filter(e => e.eventType === 'video_play' || e.watchDuration > 0);
    const avgWatchDuration = videoEvents.length ? 
      videoEvents.reduce((sum, e) => sum + (e.watchDuration || 0), 0) / videoEvents.length : 0;
    const avgCompletion = videoEvents.length ? 
      videoEvents.reduce((sum, e) => sum + (e.completionPercent || 0), 0) / videoEvents.length : 0;
    
    // Avg scroll depth
    const scrollEvents = allEvents.filter(e => e.pageScrollDepth);
    const avgScrollDepth = scrollEvents.length ? 
      scrollEvents.reduce((sum, e) => sum + e.pageScrollDepth, 0) / scrollEvents.length : 0;
    
    res.json({
      dateRange: days,
      sessions,
      totalEvents: allEvents.length,
      avgWatchDuration: Math.round(avgWatchDuration),
      avgCompletion: Math.round(avgCompletion),
      avgScrollDepth: Math.round(avgScrollDepth),
      deviceBreakdown,
      browserBreakdown,
      eventBreakdown,
      sectionPopularity,
      topVideos: Object.entries(videoStats)
        .sort((a, b) => b[1].plays - a[1].plays)
        .slice(0, 10)
        .map(([title, stats]) => ({ title, ...stats }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- GET DETAILED ANALYTICS --
app.get('/api/analytics', auth, async (req, res) => {
  try {
    const { videoId, section, days = 30 } = req.query;
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));
    
    let query = { createdAt: { $gte: dateFilter } };
    if (videoId) query.videoId = videoId;
    if (section) query.section = section;
    
    const analytics = await Analytics.find(query).sort({ createdAt: -1 }).limit(1000);
    
    // Compute stats
    const stats = {
      totalPlays: analytics.length,
      avgWatchDuration: analytics.length ? analytics.reduce((sum, a) => sum + (a.watchDuration || 0), 0) / analytics.length : 0,
      avgCompletion: analytics.length ? analytics.reduce((sum, a) => sum + (a.completionPercent || 0), 0) / analytics.length : 0,
      bySection: {},
      byVideo: {}
    };
    
    analytics.forEach(a => {
      // By section
      if (!stats.bySection[a.section]) stats.bySection[a.section] = { plays: 0, avgWatch: 0, avgCompletion: 0 };
      stats.bySection[a.section].plays++;
      
      // By video
      if (!stats.byVideo[a.videoTitle]) stats.byVideo[a.videoTitle] = { plays: 0, avgWatch: 0, avgCompletion: 0, videoId: a.videoId, section: a.section };
      stats.byVideo[a.videoTitle].plays++;
    });
    
    // Compute averages
    Object.keys(stats.bySection).forEach(sec => {
      const videos = analytics.filter(a => a.section === sec);
      stats.bySection[sec].avgWatch = videos.length ? videos.reduce((sum, a) => sum + (a.watchDuration || 0), 0) / videos.length : 0;
      stats.bySection[sec].avgCompletion = videos.length ? videos.reduce((sum, a) => sum + (a.completionPercent || 0), 0) / videos.length : 0;
    });
    
    Object.keys(stats.byVideo).forEach(title => {
      const videos = analytics.filter(a => a.videoTitle === title);
      stats.byVideo[title].avgWatch = videos.length ? videos.reduce((sum, a) => sum + (a.watchDuration || 0), 0) / videos.length : 0;
      stats.byVideo[title].avgCompletion = videos.length ? videos.reduce((sum, a) => sum + (a.completionPercent || 0), 0) / videos.length : 0;
    });
    
    res.json({ ...stats, raw: analytics });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- DELETE ANALYTICS (admin only) --
app.delete('/api/analytics/:id', auth, async (req, res) => {
  try {
    await Analytics.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- IMPORT DATA (admin only) --
app.post('/api/import', auth, async (req, res) => {
  try {
    const { gamedev, animation, video, threed, reviews, details } = req.body;
    
    // Import videos
    if (gamedev && Array.isArray(gamedev)) {
      for (const v of gamedev) {
        await Video.create({ section: 'gamedev', title: v.title, desc: v.desc, url: v.url });
      }
    }
    if (animation && Array.isArray(animation)) {
      for (const v of animation) {
        await Video.create({ section: 'animation', title: v.title, desc: v.desc, url: v.url });
      }
    }
    if (video && Array.isArray(video)) {
      for (const v of video) {
        await Video.create({ section: 'video', title: v.title, desc: v.desc, url: v.url });
      }
    }
    
    // Import models
    if (threed && Array.isArray(threed)) {
      for (const m of threed) {
        await Model3D.create({ title: m.title, desc: m.desc, url: m.url });
      }
    }
    
    // Import reviews
    if (reviews && Array.isArray(reviews)) {
      for (const r of reviews) {
        await Review.create({ name: r.name, role: r.role, text: r.text, stars: r.stars });
      }
    }
    
    // Import details
    if (details) {
      await Details.findOneAndUpdate(
        { key: 'main' },
        { ...details, key: 'main' },
        { upsert: true, new: true }
      );
    }
    
    res.json({ ok: true, message: 'Data imported successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- Catch all: serve index.html --
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));