const Topping = require('../models/Topping');

exports.getToppings = async (req, res) => {
  try {
    const { category, available } = req.query;
    let filter = {};
    
    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === 'true';
    
    const toppings = await Topping.find(filter).sort({ name: 1 });
    res.json(toppings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTopping = async (req, res) => {
  try {
    const topping = await Topping.findById(req.params.id);
    if (!topping) {
      return res.status(404).json({ message: 'Topping không tồn tại' });
    }
    res.json(topping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTopping = async (req, res) => {
  try {
    const topping = await Topping.create(req.body);
    res.status(201).json({
      success: true,
      data: topping
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTopping = async (req, res) => {
  try {
    const topping = await Topping.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!topping) {
      return res.status(404).json({ message: 'Topping không tồn tại' });
    }

    res.json({
      success: true,
      data: topping
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTopping = async (req, res) => {
  try {
    const topping = await Topping.findById(req.params.id);
    
    if (!topping) {
      return res.status(404).json({ message: 'Topping không tồn tại' });
    }

    await topping.deleteOne();
    
    res.json({
      success: true,
      message: 'Topping đã được xóa'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};