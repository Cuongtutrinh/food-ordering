import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ReviewForm from '../reviews/ReviewForm';
import ReviewList from '../reviews/ReviewList';
import { authAPI } from '../../utils/api'; 

const ProductModal = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const { addToCart, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (product?._id) {
      fetchReviews();
      checkCanReview();
      fetchToppings();
    }
  }, [product]);

 const fetchReviews = async () => {
  try {
    const response = await authAPI.get(`/reviews/product/${product._id}`);
    setReviews(response.data);
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
};

  const fetchToppings = async () => {
    try {
      const response = await authAPI.get('/toppings?available=true');
      setToppings(response.data);
    } catch (error) {
      console.error('Error fetching toppings:', error);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await api.get(`/orders/can-review/${product._id}`);
      setCanReview(response.data.canReview);
    } catch (error) {
      setCanReview(false);
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      await api.post('/reviews', reviewData);
      fetchReviews();
      setCanReview(false);
      toast.success('Đánh giá của bạn đã được gửi!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi đánh giá');
    }
  };

  if (!isOpen) return null;

  const handleToppingChange = (topping, checked) => {
    if (checked) {
      setSelectedToppings(prev => [...prev, { ...topping, quantity: 1 }]);
    } else {
      setSelectedToppings(prev => prev.filter(t => t._id !== topping._id));
    }
  };

  const updateToppingQuantity = (toppingId, newQuantity) => {
    if (newQuantity <= 0) {
      setSelectedToppings(prev => prev.filter(t => t._id !== toppingId));
    } else {
      setSelectedToppings(prev => 
        prev.map(t => t._id === toppingId ? { ...t, quantity: newQuantity } : t)
      );
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = product.price * quantity;
    const toppingsPrice = selectedToppings.reduce((total, topping) => {
      return total + (topping.price * topping.quantity * quantity);
    }, 0);
    return basePrice + toppingsPrice;
  };

  const handleAddToCart = () => {
    if (user) {
      addToCart(product, quantity, selectedToppings);
      toast.success('Đã thêm vào giỏ hàng!');
    } else {
      toast.error('Bạn phải đăng nhập để thêm sản phẩm!');
      navigate('/login');
    }
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-64 object-cover"
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                product.category === 'food' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {product.category === 'food' ? '🍔 Món ăn' : '🥤 Đồ uống'}
              </span>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {product.price.toLocaleString('vi-VN')}₫
            </div>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Thành phần:</h3>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ingredient, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Toppings Section */}
          {toppings.length > 0 && (
            <div className="mb-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thêm topping:</h3>
              <div className="space-y-3">
                {toppings.map(topping => {
                  const selectedTopping = selectedToppings.find(t => t._id === topping._id);
                  const isSelected = !!selectedTopping;
                  
                  return (
                    <div key={topping._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToppingChange(topping, e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <div>
                          <span className="font-medium text-gray-800">{topping.name}</span>
                          <div className="text-sm text-gray-600">{topping.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-orange-600">
                          +{topping.price.toLocaleString('vi-VN')}₫
                        </span>
                        
                        {isSelected && (
                          <div className="flex items-center border rounded">
                            <button
                              onClick={() => updateToppingQuantity(topping._id, selectedTopping.quantity - 1)}
                              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 border-x text-sm font-semibold">
                              {selectedTopping.quantity}
                            </span>
                            <button
                              onClick={() => updateToppingQuantity(topping._id, selectedTopping.quantity + 1)}
                              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-700">Số lượng:</span>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={decreaseQuantity}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-1 border-x font-semibold">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold text-orange-600 mb-2">
                Tổng: {calculateTotalPrice().toLocaleString('vi-VN')}₫
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold flex items-center space-x-2"
              >
                <span>Thêm vào giỏ</span>
                <span>({quantity})</span>
              </button>
            </div>
          </div>

          <div className="border-t mt-6 pt-6">
            {canReview && (
              <ReviewForm 
                productId={product._id}
                onSubmitReview={handleSubmitReview}
              />
            )}
            
            <ReviewList reviews={reviews} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;