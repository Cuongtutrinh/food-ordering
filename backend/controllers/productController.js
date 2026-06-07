const Product = require('../models/Product');
const menuService = require('../utils/menuService');

exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category, available: true } : { available: true };
    
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    // Làm mới cache menu sau khi thêm sản phẩm mới
    menuService.clearMenuCache();
    console.log('[ProductController] Đã làm mới cache menu sau khi thêm sản phẩm mới');
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Làm mới cache menu sau khi cập nhật sản phẩm
    menuService.clearMenuCache();
    console.log('[ProductController] Đã làm mới cache menu sau khi cập nhật sản phẩm');
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { available: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Làm mới cache menu sau khi xóa sản phẩm
    menuService.clearMenuCache();
    console.log('[ProductController] Đã làm mới cache menu sau khi xóa sản phẩm');
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};