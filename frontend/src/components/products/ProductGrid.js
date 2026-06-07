import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ProductGrid = ({ products, onProductClick }) => {
  const { addToCart, user } = useAuth(); // Lấy thêm `user` từ context
  const navigate = useNavigate();

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan ra thẻ cha (mở modal)
    
    // Kiểm tra xem người dùng đã đăng nhập hay chưa
    if (user) {
      // Nếu đã đăng nhập, chỉ cần thêm vào giỏ và thông báo
      addToCart(product, 1);
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    } else {
      // Nếu chưa đăng nhập, thông báo và chuyển hướng đến trang login
      toast.error('Quý khách phải đăng nhập mới được mua sản phẩm');
      navigate('/login');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <div
          key={product._id}
          className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 group"
          onClick={() => onProductClick(product)}
        >
          <div className="relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{product.description.substring(0, 50)}...</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xl font-bold text-orange-600">
                {product.price.toLocaleString('vi-VN')}₫
              </span>
              <button
                onClick={(e) => handleAddToCart(e, product)}
                className="bg-orange-100 text-orange-600 p-2 rounded-full hover:bg-orange-600 hover:text-white transition-colors duration-300 opacity-0 group-hover:opacity-100"
                aria-label={`Thêm ${product.name} vào giỏ hàng`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;