const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide a category']
  },
  images: [{
    type: String,
    required: [true, 'Please provide at least one product image']
  }],
  price: {
    type: Number,
    required: [true, 'Please provide a rental price'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Please provide the original price'],
    min: [0, 'Original price cannot be negative']
  },
  size: {
    type: String,
    required: [true, 'Please provide a size'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']
  },
  color: {
    type: String,
    required: [true, 'Please provide a color'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair'],
    default: 'Good'
  },
  rentalDuration: {
    type: Number,
    required: [true, 'Please provide rental duration in days'],
    min: [1, 'Rental duration must be at least 1 day']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  careInstructions: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    lowercase: true
  },
  views: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  next();
});

// Index for search functionality
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema); 