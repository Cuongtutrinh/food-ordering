const express = require('express');
const { resetPassword } = require('../controllers/authController');
const router = express.Router();

router.put('/:token', resetPassword);

module.exports = router;