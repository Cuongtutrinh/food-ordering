import React from 'react';
import { Link } from 'react-router-dom';
import { FaPhone, FaMapMarkerAlt, FaEnvelope, FaUtensils, FaShippingFast, FaHeart } from 'react-icons/fa';

// Các hình ảnh minh họa cho cửa hàng. Bạn có thể thay thế bằng ảnh thật của mình.
const storeImage1 = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop';
const storeImage2 = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop';
const storeImage3 = 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?q=80&w=1974&auto=format&fit=crop';

const About = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-4">Về Chúng Tôi - FoodOrder</h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Hành trình mang đến những bữa ăn ngon, nhanh chóng và tiện lợi cho mọi nhà.
          </p>
        </header>

        {/* Image Gallery Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <img src={storeImage1} alt="Không gian cửa hàng 1" className="rounded-lg shadow-lg object-cover h-64 w-full" />
            <img src={storeImage2} alt="Không gian cửa hàng 2" className="rounded-lg shadow-lg object-cover h-64 w-full" />
            <img src={storeImage3} alt="Không gian cửa hàng 3" className="rounded-lg shadow-lg object-cover h-64 w-full" />
          </div>
        </section>

        {/* Our Story Section */}
        <section className="mb-16 bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Câu Chuyện Của Chúng Tôi</h2>
          <p className="text-gray-600 leading-relaxed text-center max-w-4xl mx-auto">
            FoodOrder ra đời từ niềm đam mê ẩm thực và mong muốn mang đến những bữa ăn chất lượng, tiện lợi cho cuộc sống bận rộn. Chúng tôi tin rằng một bữa ăn ngon không chỉ giúp no bụng mà còn là nguồn năng lượng tích cực cho một ngày làm việc hiệu quả. Vì vậy, chúng tôi luôn nỗ lực mỗi ngày để lựa chọn những nguyên liệu tươi ngon nhất, chế biến cẩn thận và giao hàng nhanh chóng đến tận tay bạn.
          </p>
        </section>

        {/* Our Values Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Giá Trị Cốt Lõi</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FaUtensils className="text-4xl text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Chất Lượng</h3>
              <p className="text-gray-600">Nguyên liệu tươi ngon, công thức độc đáo và quy trình chế biến hợp vệ sinh.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FaShippingFast className="text-4xl text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nhanh Chóng</h3>
              <p className="text-gray-600">Cam kết giao hàng tận nơi trong thời gian ngắn nhất để món ăn luôn nóng hổi.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FaHeart className="text-4xl text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tận Tâm</h3>
              <p className="text-gray-600">Luôn lắng nghe và hỗ trợ khách hàng để mang lại trải nghiệm tốt nhất.</p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-orange-500 text-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Liên Hệ Với Chúng Tôi</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Bạn có câu hỏi hoặc góp ý? Đừng ngần ngại liên hệ với chúng tôi qua các kênh dưới đây.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center">
              <FaPhone className="mr-3" />
              <a href="tel:0879237856" className="hover:underline">0879-237-856</a>
            </div>
            <div className="flex items-center">
              <FaEnvelope className="mr-3" />
              <a href="mailto:cuongtutrinh05@gmail.com" className="hover:underline">cuongtutrinh05@gmail.com</a>
            </div>
            <div className="flex items-center">
              <FaMapMarkerAlt className="mr-3" />
              <span>Số 23, Ngõ 234 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội</span>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center mt-16">
            <Link
              to="/"
              className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition duration-300 font-semibold inline-block text-lg"
            >
              Khám Phá Menu & Đặt Món Ngay
            </Link>
        </section>

      </div>
    </div>
  );
};

export default About;












































































































































