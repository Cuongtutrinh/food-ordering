const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
  getToppings,
  getTopping,
  createTopping,
  updateTopping,
  deleteTopping
} = require('../controllers/toppingController');
const router = express.Router();

router.route('/')
  .get(getToppings)
  .post(protect, admin, createTopping);

router.route('/:id')
  .get(getTopping)
  .put(protect, admin, updateTopping)
  .delete(protect, admin, deleteTopping);

module.exports = router;