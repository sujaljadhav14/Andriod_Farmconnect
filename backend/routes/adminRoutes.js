const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Crop = require('../models/Crop');
const Proposal = require('../models/Proposal');
const Order = require('../models/Order');
const Agreement = require('../models/Agreement');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');

// ✅ GET ADMIN STATS
router.get('/stats', async (req, res) => {
  try {
    // Get totals
    const totalUsers = await User.countDocuments();
    const totalCrops = await Crop.countDocuments();
    const totalProposals = await Proposal.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalAgreements = await Agreement.countDocuments();
    const totalDisputes = await Dispute.countDocuments();

    // Get by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Get by account status
    const usersByAccountStatus = await User.aggregate([
      { $group: { _id: '$accountStatus', count: { $sum: 1 } } },
    ]);

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Get proposals by status
    const proposalsByStatus = await Proposal.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Get disputes by status
    const disputesByStatus = await Dispute.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Get financial data
    const totalTransactions = await Transaction.countDocuments();
    const totalTransactionAmount = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          crops: totalCrops,
          proposals: totalProposals,
          orders: totalOrders,
          agreements: totalAgreements,
          disputes: totalDisputes,
          transactions: totalTransactions,
        },
        usersByRole,
        usersByAccountStatus,
        ordersByStatus,
        proposalsByStatus,
        disputesByStatus,
        finance: {
          totalTransactions,
          totalAmount: totalTransactionAmount[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ✅ GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ✅ GET USER DETAILS
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ✅ SUSPEND USER
router.put('/users/:userId/suspend', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        accountStatus: 'suspended',
        accountStatusReason: req.body.reason || 'Admin suspension',
        accountStatusUpdatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User suspended',
      data: user,
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ✅ ACTIVATE USER
router.put('/users/:userId/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        accountStatus: 'active',
        accountStatusReason: '',
        accountStatusUpdatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User activated',
      data: user,
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ✅ BAN USER
router.put('/users/:userId/ban', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        accountStatus: 'banned',
        accountStatusReason: req.body.reason || 'Admin ban',
        accountStatusUpdatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User banned',
      data: user,
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
