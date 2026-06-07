import React from 'react';
import { useAuth } from '../../context/AuthContext';

const ProductCard = ({ product, onProductClick }) => {
  const { addToCart } = useAuth();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={() => onProductClick(product)}
    >
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            product.category === 'food' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {product.category === 'food' ? '🍔 Món ăn' : '🥤 Đồ uống'}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-orange-600">
            {product.price.toLocaleString('vi-VN')}₫
          </span>
          
          <button
            onClick={handleAddToCart}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium flex items-center space-x-1"
          >
            <span>+</span>
            <span>Thêm</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;