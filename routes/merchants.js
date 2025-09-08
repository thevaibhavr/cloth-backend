const express = require('express');
const { body, validationResult } = require('express-validator');
const Merchant = require('../models/merchent');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/merchants
// @desc    Get all merchants with pagination
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const merchants = await Merchant.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Merchant.countDocuments(filter);

    res.json({
      success: true,
      data: {
        merchants,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching merchants'
    });
  }
});

// @route   GET /api/merchants/:id
// @desc    Get single merchant
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id);
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      data: { merchant }
    });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching merchant'
    });
  }
});

// @route   POST /api/merchants
// @desc    Create new merchant
// @access  Private/Admin
router.post('/', protect, admin, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('mobilenumber').optional().isNumeric().withMessage('Mobile number must be numeric'),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, mobilenumber, address } = req.body;

    const merchant = new Merchant({
      name,
      mobilenumber,
      address
    });

    await merchant.save();

    res.status(201).json({
      success: true,
      message: 'Merchant created successfully',
      data: { merchant }
    });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating merchant'
    });
  }
});

// @route   PUT /api/merchants/:id
// @desc    Update merchant
// @access  Private/Admin
router.put('/:id', protect, admin, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('mobilenumber').optional().isNumeric().withMessage('Mobile number must be numeric'),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const merchant = await Merchant.findById(req.params.id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Update merchant
    const updatedMerchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Merchant updated successfully',
      data: { merchant: updatedMerchant }
    });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating merchant'
    });
  }
});

// @route   DELETE /api/merchants/:id
// @desc    Delete merchant
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id);
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    await Merchant.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Merchant deleted successfully'
    });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting merchant'
    });
  }
});

module.exports = router;
