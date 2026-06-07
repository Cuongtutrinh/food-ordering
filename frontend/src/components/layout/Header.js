import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout, cart, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  // Hiển thị loading nếu đang khôi phục giỏ hàng
  if (loading) {
    return (
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center">
              <span className="mr-2">🍕</span>
              FoodOrder
            </div>
            <div className="text-gray-500">Đang tải...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-orange-600 flex items-center">
            <span className="mr-2">🍕</span>
            FoodOrder
          </Link>

          <nav className="hidden md:flex space-x-6">
            {/* User thường: hiển thị đầy đủ */}
            {user && user.role !== 'admin' && (
              <>
                <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium transition duration-200">
                  Trang chủ
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-orange-600 font-medium transition duration-200">
                  Đơn hàng
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-orange-600 font-medium transition duration-200">
                  Thông tin
                </Link>
              </>
            )}
            
            {/* Admin: chỉ hiển thị Dashboard */}
            {user && user.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-orange-600 font-medium transition duration-200">
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Ẩn giỏ hàng với admin */}
                {user.role !== 'admin' && (
                  <Link to="/cart" className="relative text-gray-700 hover:text-orange-600 transition duration-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 hidden sm:block">
                    Xin chào, {user.name}
                    {user.role === 'admin' && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="border border-orange-600 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition duration-200 font-medium"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;