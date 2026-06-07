const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Truy cập bị từ chối. Yêu cầu quyền admin.' 
    });
  }
};

module.exports = admin;