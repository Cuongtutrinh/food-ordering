const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  updateProfile, 
  getUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  addPhone,
  updatePhone,
  deletePhone,
  getAllUsers,
  updateUserRole,
  deleteUser
} = require('../controllers/userController');
const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateProfile);

// Routes cho địa chỉ
router.route('/addresses')
  .post(protect, addAddress);

router.route('/addresses/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

// Routes cho số điện thoại
router.route('/phones')
  .post(protect, addPhone);

router.route('/phones/:phoneId')
  .put(protect, updatePhone)
  .delete(protect, deletePhone);

router.route('/')
  .get(protect, getAllUsers);

router.route('/:id/role')
  .put(protect, updateUserRole);

router.route('/:id')
  .delete(protect, deleteUser);

module.exports = router;