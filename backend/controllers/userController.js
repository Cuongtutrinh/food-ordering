const User = require('../models/User');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }
    
    // Migrate dữ liệu cũ nếu cần
    const hasChanges = user.migrateOldData();
    if (hasChanges) {
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    
    // Cập nhật phone và address cũ để tương thích ngược
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    await user.save();
    
    const updatedUser = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Thêm địa chỉ mới
exports.addAddress = async (req, res) => {
  try {
    const { label, address, isDefault } = req.body;

    console.log('Adding address for user:', req.user._id);
    console.log('Address data:', { label, address, isDefault });

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy User ID.' });
    }

    if (!label || !address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin địa chỉ'
      });
    }

    let user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Nếu đây là địa chỉ mặc định, bỏ mặc định của các địa chỉ khác
    if (isDefault && user.addresses) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Tạo địa chỉ mới
    const newAddress = {
      label,
      address,
      isDefault: isDefault || false
    };

    // Thêm địa chỉ vào mảng
    if (!user.addresses) {
      user.addresses = [];
    }
    user.addresses.push(newAddress);

    user = await user.save();

    console.log('Address added successfully');

    res.json({
      success: true,
      message: 'Thêm địa chỉ thành công',
      addresses: user.addresses
    });

  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm địa chỉ'
    });
  }
};

// Cập nhật địa chỉ
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, address, isDefault } = req.body;
    
    console.log('Updating address:', addressId, { label, address, isDefault });
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    const addressDoc = user.addresses.id(addressId);
    if (!addressDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    // Nếu set làm default, bỏ default của các địa chỉ khác
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    addressDoc.label = label;
    addressDoc.address = address;
    addressDoc.isDefault = isDefault;
    
    await user.save();
    
    console.log('Address updated successfully');
    
    res.json({
      success: true,
      message: 'Cập nhật địa chỉ thành công',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Xóa địa chỉ
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    console.log('Deleting address:', addressId);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    const addressDoc = user.addresses.id(addressId);
    if (!addressDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    addressDoc.deleteOne();
    await user.save();
    
    console.log('Address deleted successfully');
    
    res.json({
      success: true,
      message: 'Xóa địa chỉ thành công',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Thêm số điện thoại mới
exports.addPhone = async (req, res) => {
  try {
    const { label, phone, isDefault = false } = req.body;
    
    console.log('Adding phone for user:', req.user._id);
    console.log('Phone data:', { label, phone, isDefault });
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Nếu là default, bỏ default của các số khác
    if (isDefault) {
      user.phones.forEach(ph => ph.isDefault = false);
    }
    
    // Nếu là số điện thoại đầu tiên, tự động set làm default
    if (user.phones.length === 0) {
      isDefault = true;
    }
    
    user.phones.push({ label, phone, isDefault });
    await user.save();
    
    console.log('Phone added successfully:', user.phones);
    
    res.json({
      success: true,
      message: 'Thêm số điện thoại thành công',
      phones: user.phones
    });
  } catch (error) {
    console.error('Add phone error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Cập nhật số điện thoại
exports.updatePhone = async (req, res) => {
  try {
    const { phoneId } = req.params;
    const { label, phone, isDefault } = req.body;
    
    console.log('Updating phone:', phoneId, { label, phone, isDefault });
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    const phoneDoc = user.phones.id(phoneId);
    if (!phoneDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy số điện thoại'
      });
    }
    
    // Nếu set làm default, bỏ default của các số khác
    if (isDefault) {
      user.phones.forEach(ph => ph.isDefault = false);
    }
    
    phoneDoc.label = label;
    phoneDoc.phone = phone;
    phoneDoc.isDefault = isDefault;
    
    await user.save();
    
    console.log('Phone updated successfully');
    
    res.json({
      success: true,
      message: 'Cập nhật số điện thoại thành công',
      phones: user.phones
    });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Xóa số điện thoại
exports.deletePhone = async (req, res) => {
  try {
    const { phoneId } = req.params;
    
    console.log('Deleting phone:', phoneId);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    const phoneDoc = user.phones.id(phoneId);
    if (!phoneDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy số điện thoại'
      });
    }
    
    phoneDoc.deleteOne();
    await user.save();
    
    console.log('Phone deleted successfully');
    
    res.json({
      success: true,
      message: 'Xóa số điện thoại thành công',
      phones: user.phones
    });
  } catch (error) {
    console.error('Delete phone error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Không trả về password
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('[getAllUsers] error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng'
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('[updateUserRole] error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật role'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không cho phép xóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản của chính mình'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Đã xóa người dùng'
    });
  } catch (error) {
    console.error('[deleteUser] error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa người dùng'
    });
  }
};
