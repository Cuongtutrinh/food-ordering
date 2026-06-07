import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">FoodOrder</h3>
            <p className="text-gray-300">
              Đặt đồ ăn online nhanh chóng và tiện lợi. Giao hàng tận nơi trong vòng 30 phút.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên kết</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-white transition duration-200">Trang chủ</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white transition duration-200">Về chúng tôi</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
            <div className="text-gray-300 space-y-2">
              <p>📞 0879-237-856</p>
              <p>📧 cuongtutrinh05@gmail.com</p>
              <p>📍 Số 23, Ngõ 234 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 FoodOrder. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;