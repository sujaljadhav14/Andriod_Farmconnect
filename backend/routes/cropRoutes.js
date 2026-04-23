const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');

// ✅ GET MY CROPS (FARMER'S CROPS)
router.get('/my-crops', async (req, res) => {
  try {
    // For now, accept farmerId from query parameter
    // In production, extract from JWT token
    const farmerId = req.query.farmerId || req.user?._id;
    
    if (!farmerId) {
      return res.json({
        success: true,
        data: [],
        crops: [],
      });
    }

    const crops = await Crop.find({ farmerId }).populate('farmerId', 'name phone');

    res.json({
      success: true,
      data: crops || [],
      crops: crops || [],
    });
  } catch (error) {
    console.error('Error fetching my crops:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ GET ALL AVAILABLE CROPS (MUST BE AFTER /my-crops to avoid route conflict)
router.get('/available', async (req, res) => {
  try {
    const crops = await Crop.find().populate('farmerId', 'name phone');

    res.json({
      success: true,
      data: crops || [],
      crops: crops || [],
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ GET SINGLE CROP BY ID (MUST BE AFTER /available and /my-crops)
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('farmerId', 'name phone');

    if (!crop) {
      return res.status(404).json({ 
        success: false,
        message: 'Crop not found' 
      });
    }

    res.json({
      success: true,
      data: crop,
      crop: crop,
    });
  } catch (error) {
    console.error('Error fetching crop:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;