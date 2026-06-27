require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

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

const Video   = mongoose.model('Video', VideoSchema);
const Model3D = mongoose.model('Model3D', ModelSchema);
const Review  = mongoose.model('Review', ReviewSchema);
const Details = mongoose.model('Details', DetailsSchema);

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

// -- Catch all: serve index.html --
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));