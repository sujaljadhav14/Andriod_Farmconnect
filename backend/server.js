const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Crop = require('./models/Crop');

const app = express();
const port = Number(process.env.PORT || 5050);
const mongoUri = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/crops', async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const crops = await Crop.find().sort({ createdAt: -1 });
    res.json(crops);
  } catch (error) {
    console.error('Failed to fetch crops:', error);
    res.status(500).json({ message: 'Failed to fetch crops' });
  }
});

app.post('/addCrop', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const { cropName, category, quantity, price, qualityGrade, farmerId } = req.body;

  if (!cropName || !category || !qualityGrade || !farmerId) {
    res.status(400).json({ message: 'Missing required crop fields' });
    return;
  }

  try {
    const crop = await Crop.create({
      cropName,
      category,
      quantity: Number(quantity),
      price: Number(price),
      qualityGrade,
      farmerId,
    });

    res.status(201).json({
      success: true,
      data: crop,
    });
  } catch (error) {
    console.error('Failed to save crop:', error);
    res.status(500).json({ message: 'Failed to save crop' });
  }
});

const start = async () => {
  if (!mongoUri) {
    console.warn('MONGO_URI is not set. Backend will start without a database connection.');
  } else {
    try {
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Crop backend listening on port ${port}`);
  });
};

start();
