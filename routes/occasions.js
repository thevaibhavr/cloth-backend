const express = require('express');
const { body, validationResult } = require('express-validator');
const Occasion = require('../models/Occasion');
const { protect, admin } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../config/cloudinary');

const router = express.Router();

const normalizeStatus = (status) => {
  if (!status) return 'active';
  return status.toLowerCase() === 'inactive' ? 'inactive' : 'active';
};

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      sort = 'displayOrder',
      order = 'asc'
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = normalizeStatus(status);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const occasions = await Occasion.find(filter)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Occasion.countDocuments(filter);

    res.json({
      success: true,
      data: {
        occasions,
        totalPages: Math.ceil(total / Number(limit)) || 1,
        currentPage: Number(page),
        total
      }
    });
  } catch (error) {
    console.error('Get occasions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching occasions'
    });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const occasion = await Occasion.findOne({ slug: req.params.slug });

    if (!occasion) {
      return res.status(404).json({
        success: false,
        message: 'Occasion not found'
      });
    }

    res.json({
      success: true,
      data: { occasion }
    });
  } catch (error) {
    console.error('Get occasion by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching occasion'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const occasion = await Occasion.findById(req.params.id);

    if (!occasion) {
      return res.status(404).json({
        success: false,
        message: 'Occasion not found'
      });
    }

    res.json({
      success: true,
      data: { occasion }
    });
  } catch (error) {
    console.error('Get occasion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching occasion'
    });
  }
});

router.post('/', protect, admin, [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
  body('description').optional().trim().isLength({ max: 300 }).withMessage('Description cannot be more than 300 characters'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
  body('image').optional()
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

    const { name, description, image, status, displayOrder } = req.body;

    const existingByName = await Occasion.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existingByName) {
      return res.status(400).json({
        success: false,
        message: 'An occasion with this name already exists'
      });
    }

    let imageUrl = image || '';
    if (imageUrl && imageUrl.startsWith('data:image')) {
      const uploadResult = await uploadImage(imageUrl, 'occasions');
      imageUrl = uploadResult.url;
    }

    const occasion = new Occasion({
      name,
      description,
      image: imageUrl,
      status: normalizeStatus(status),
      isActive: normalizeStatus(status) === 'active',
      displayOrder: displayOrder ?? 0
    });

    await occasion.save();

    res.status(201).json({
      success: true,
      message: 'Occasion created successfully',
      data: { occasion }
    });
  } catch (error) {
    console.error('Create occasion error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An occasion with this name or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating occasion'
    });
  }
});

router.put('/:id', protect, admin, [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
  body('description').optional().trim().isLength({ max: 300 }).withMessage('Description cannot be more than 300 characters'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
  body('image').optional()
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

    const occasion = await Occasion.findById(req.params.id);
    if (!occasion) {
      return res.status(404).json({
        success: false,
        message: 'Occasion not found'
      });
    }

    const { name, description, image, status, displayOrder } = req.body;

    if (name && name.toLowerCase() !== occasion.name.toLowerCase()) {
      const existingByName = await Occasion.findOne({ name: new RegExp(`^${name}$`, 'i'), _id: { $ne: occasion._id } });
      if (existingByName) {
        return res.status(400).json({
          success: false,
          message: 'An occasion with this name already exists'
        });
      }
    }

    let imageUrl = occasion.image;
    if (image && image.startsWith('data:image')) {
      const uploadResult = await uploadImage(image, 'occasions');
      imageUrl = uploadResult.url;
    } else if (image) {
      imageUrl = image;
    }

    if (name) occasion.name = name;
    if (description !== undefined) occasion.description = description;
    if (imageUrl) occasion.image = imageUrl;
    if (status) {
      occasion.status = normalizeStatus(status);
      occasion.isActive = occasion.status === 'active';
    }
    if (displayOrder !== undefined) occasion.displayOrder = Number(displayOrder);

    await occasion.save();

    res.json({
      success: true,
      message: 'Occasion updated successfully',
      data: { occasion }
    });
  } catch (error) {
    console.error('Update occasion error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An occasion with this name or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating occasion'
    });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const occasion = await Occasion.findById(req.params.id);
    if (!occasion) {
      return res.status(404).json({
        success: false,
        message: 'Occasion not found'
      });
    }

    if (occasion.image && occasion.image.includes('cloudinary')) {
      try {
        const publicId = occasion.image.split('/').pop().split('.')[0];
        await deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting occasion image from Cloudinary:', error);
      }
    }

    await Occasion.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Occasion deleted successfully'
    });
  } catch (error) {
    console.error('Delete occasion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting occasion'
    });
  }
});

module.exports = router;
