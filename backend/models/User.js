const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const phoneSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: String,
  
  // Legacy fields for backward compatibility
  phone: String,
  address: String,
  
  // New arrays for multiple addresses and phones
  addresses: [addressSchema],
  phones: [phoneSchema],
  
  // OAuth fields
  googleId: String,
  facebookId: String,
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Reward points
  rewardPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userSchema.methods.migrateOldData = function() {
  let hasChanges = false;
  
  try {
    // Migrate old phone data
    if (this.phone && (!this.phones || this.phones.length === 0)) {
      this.phones = [{
        label: 'Số chính',
        phone: this.phone,
        isDefault: true
      }];
      hasChanges = true;
    }
    
    // Migrate old address data
    if (this.address && (!this.addresses || this.addresses.length === 0)) {
      this.addresses = [{
        label: 'Nhà riêng',
        address: this.address,
        isDefault: true
      }];
      hasChanges = true;
    }
  } catch (error) {
    console.error('Migration error in migrateOldData:', error);
    // Return false to indicate no changes if error occurs
    return false;
  }
  
  return hasChanges;
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  // ✅ CHỈ hash khi password được modify
  if (!this.isModified('password')) {
    console.log('[pre-save] Password not modified, skipping hash');
    return next();
  }
  
  console.log('[pre-save] Password modified, hashing...');
  console.log('[pre-save] Raw password:', this.password);
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('[pre-save] Password hashed:', this.password.substring(0, 20) + '...');
    next();
  } catch (error) {
    console.error('[pre-save] Hash error:', error);
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('[comparePassword] Comparing passwords');
  console.log('[comparePassword] Candidate password:', candidatePassword);
  console.log('[comparePassword] Stored password hash:', this.password?.substring(0, 20) + '...');
  
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('[comparePassword] Result:', result);
  
  return result;
};

module.exports = mongoose.model('User', userSchema);