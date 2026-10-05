const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an occasion name'],
    trim: true,
    unique: true,
    maxlength: [80, 'Occasion name cannot be more than 80 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot be more than 300 characters']
  },
  image: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

occasionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.isActive = this.status === 'active';
  }

  if (!this.isModified('name') && !this.isModified('status')) return next();

  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  this.slug = baseSlug || 'occasion';
  next();
});

occasionSchema.pre('validate', async function(next) {
  if (!this.isModified('name')) return next();

  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const slug = baseSlug || 'occasion';
  const existing = await this.constructor.findOne({
    slug,
    _id: { $ne: this._id }
  });

  if (existing) {
    this.slug = `${slug}-${Date.now().toString(36)}`;
  } else {
    this.slug = slug;
  }

  next();
});

module.exports = mongoose.model('Occasion', occasionSchema);
