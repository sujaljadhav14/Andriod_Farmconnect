const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Crop = require('../models/Crop');
const { authenticateToken } = require('../middleware/auth');

// ✅ CREATE PROPOSAL (POST /proposals) - REQUIRES AUTH
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { cropId, quantity, price } = req.body;

    if (!cropId || !quantity || !price) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: cropId, quantity, price' 
      });
    }

    const crop = await Crop.findById(cropId);

    if (!crop) {
      return res.status(404).json({ 
        success: false,
        message: 'Crop not found' 
      });
    }

    // Calculate total amount and proposed delivery date
    const totalAmount = quantity * price;
    const proposedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const proposal = new Proposal({
      cropId,
      farmerId: crop.farmerId,
      traderId: req.user._id,
      quantity,
      priceOffered: price,
      price,
      totalAmount,
      proposedDeliveryDate,
      status: 'pending',
    });

    const saved = await proposal.save();

    res.json({
      success: true,
      message: 'Proposal created successfully',
      data: saved,
    });

  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ✅ CREATE PROPOSAL (POST /proposals/create - legacy support) - REQUIRES AUTH
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { cropId, quantity, price } = req.body;

    if (!cropId || !quantity || !price) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    const crop = await Crop.findById(cropId);

    if (!crop) {
      return res.status(404).json({ 
        success: false,
        message: 'Crop not found' 
      });
    }

    // Calculate total amount and proposed delivery date
    const totalAmount = quantity * price;
    const proposedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const proposal = new Proposal({
      cropId,
      farmerId: crop.farmerId,
      traderId: req.user._id,
      quantity,
      priceOffered: price,
      price,
      totalAmount,
      proposedDeliveryDate,
      status: 'pending',
    });

    const saved = await proposal.save();

    res.json({
      success: true,
      message: 'Proposal created successfully',
      data: saved,
    });

  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ✅ GET PROPOSALS FOR TRADER - REQUIRES AUTH
router.get('/trader', authenticateToken, async (req, res) => {
  try {
    const proposals = await Proposal.find({ traderId: req.user._id })
      .populate('cropId')
      .populate('farmerId', 'name phone');

    res.json({
      success: true,
      data: proposals || [],
    });
  } catch (error) {
    console.error('Error fetching trader proposals:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ GET PROPOSALS FOR FARMER - REQUIRES AUTH
router.get('/farmer', authenticateToken, async (req, res) => {
  try {
    const proposals = await Proposal.find({ farmerId: req.user._id })
      .populate('cropId')
      .populate('traderId', 'name phone');

    res.json({
      success: true,
      data: proposals || [],
    });
  } catch (error) {
    console.error('Error fetching farmer proposals:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ GET PROPOSALS STATS
router.get('/stats', async (req, res) => {
  try {
    const total = await Proposal.countDocuments();
    const pending = await Proposal.countDocuments({ status: 'pending' });
    const accepted = await Proposal.countDocuments({ status: 'accepted' });
    const rejected = await Proposal.countDocuments({ status: 'rejected' });

    res.json({
      success: true,
      data: {
        total,
        pending,
        accepted,
        rejected,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ GET PROPOSALS FOR A CROP
router.get('/crop/:cropId', async (req, res) => {
  try {
    const proposals = await Proposal.find({ cropId: req.params.cropId })
      .populate('traderId', 'name phone')
      .populate('farmerId', 'name phone');

    res.json({
      success: true,
      data: proposals || [],
    });
  } catch (error) {
    console.error('Error fetching crop proposals:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ ACCEPT PROPOSAL
router.post('/:proposalId/accept', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.proposalId,
      { status: 'accepted' },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ 
        success: false,
        message: 'Proposal not found' 
      });
    }

    res.json({
      success: true,
      message: 'Proposal accepted',
      data: proposal,
    });
  } catch (error) {
    console.error('Error accepting proposal:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ REJECT PROPOSAL
router.post('/:proposalId/reject', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.proposalId,
      { status: 'rejected' },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ 
        success: false,
        message: 'Proposal not found' 
      });
    }

    res.json({
      success: true,
      message: 'Proposal rejected',
      data: proposal,
    });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ WITHDRAW PROPOSAL
router.post('/:proposalId/withdraw', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.proposalId,
      { status: 'withdrawn' },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ 
        success: false,
        message: 'Proposal not found' 
      });
    }

    res.json({
      success: true,
      message: 'Proposal withdrawn',
      data: proposal,
    });
  } catch (error) {
    console.error('Error withdrawing proposal:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;