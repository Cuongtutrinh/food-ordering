import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { FaStar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const message = location.state?.message;
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await authAPI.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      'pending_payment': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-orange-100 text-orange-800',
      'confirmed': 'bg-green-100 text-green-800',
      'preparing': 'bg-blue-100 text-blue-800',
      'shipping': 'bg-purple-100 text-purple-800',
      'delivering': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-emerald-100 text-emerald-800',
      'cancelled': 'bg-red-100 text-red-800',
      'canceled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending_payment': 'Chờ thanh toán QR',
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'preparing': 'Đang chuẩn bị',
      'shipping': 'Đang giao hàng',
      'delivering': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy',
      'canceled': 'Đã hủy'
    };
    return texts[status] || status;
  };

  const getPaymentStatusColor = (paymentMethod, paymentStatus) => {
    if (paymentMethod === 'cod') {
      return 'bg-gray-100 text-gray-800';
    }
    return paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getPaymentStatusText = (paymentMethod, paymentStatus) => {
    if (paymentMethod === 'cod') {
      return 'Thanh toán khi nhận hàng';
    }
    return paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán';
  };

  const openReviewModal = (product) => {
    setSelectedProduct(product);
    setRating(0);
    setComment('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      if (!rating) {
        toast.error('Vui lòng chọn số sao đánh giá');
        return;
      }

      if (!comment.trim()) {
        toast.error('Vui lòng nhập nội dung đánh giá');
        return;
      }

      const response = await authAPI.post('/reviews', {
        productId: selectedProduct._id,
        rating,
        comment: comment.trim()
      });

      toast.success(response.data.message || 'Cảm ơn bạn đã đánh giá!');
      setIsReviewModalOpen(false);
      fetchOrders(); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
          <p className="text-gray-600 mt-2">Theo dõi trạng thái đơn hàng của bạn</p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
            {message}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-gray-600 mb-6">Hãy đặt món ngay để trải nghiệm dịch vụ của chúng tôi!</p>
            <a
              href="/"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold inline-block"
            >
              Đặt món ngay
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Đơn hàng #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(order.paymentMethod, order.paymentStatus)}`}>
                          {getPaymentStatusText(order.paymentMethod, order.paymentStatus)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      {/* ✅ Fix: Sử dụng getStatusClass thay vì getStatusColor */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.orderStatus)}`}>
                        {getStatusText(order.orderStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, index) => {
                      if (!item.product) {
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Không có ảnh</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">Sản phẩm không tồn tại</h4>
                                <p className="text-gray-600 text-sm">
                                  {item.price?.toLocaleString('vi-VN') || '0'}₫ × {item.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}₫
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Tính tổng giá bao gồm toppings
                      const basePrice = item.price * item.quantity;
                      const toppingsPrice = (item.toppings || []).reduce((total, topping) => {
                        return total + (topping.price * topping.quantity * item.quantity);
                      }, 0);
                      const totalItemPrice = basePrice + toppingsPrice;

                      return (
                        <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-4">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                              <p className="text-gray-600 text-sm">
                                {item.price.toLocaleString('vi-VN')}₫ × {item.quantity}
                              </p>
                              
                              {/* Hiển thị toppings nếu có */}
                              {item.toppings && item.toppings.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Toppings:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.toppings.map((topping, toppingIndex) => (
                                      <span 
                                        key={toppingIndex} 
                                        className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full"
                                      >
                                        {topping.name} x{topping.quantity} 
                                        (+{(topping.price * topping.quantity).toLocaleString('vi-VN')}₫)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Nút đánh giá cho sản phẩm đã giao */}
                              {order.orderStatus === 'delivered' && (
                                <button
                                  onClick={() => openReviewModal(item.product)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  Đánh giá sản phẩm
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {totalItemPrice.toLocaleString('vi-VN')}₫
                            </div>
                            {toppingsPrice > 0 && (
                              <div className="text-xs text-gray-500">
                                (SP: {basePrice.toLocaleString('vi-VN')}₫ + 
                                Topping: {toppingsPrice.toLocaleString('vi-VN')}₫)
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Phương thức: {
                          order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' :
                          order.paymentMethod === 'qrcode' ? 'QR Code' : 'Khác'
                        }</p>
                        <p>Địa chỉ: {order.shippingAddress}</p>
                        <p>SĐT: {order.phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {order.totalAmount.toLocaleString('vi-VN')}₫
                        </div>
                        <p className="text-sm text-gray-500">(Đã bao gồm phí giao hàng)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Đánh giá sản phẩm: {selectedProduct?.name}
            </h3>

            <form onSubmit={handleSubmitReview}>
              <div className="flex mb-4">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <FaStar
                      key={index}
                      className="cursor-pointer mr-1"
                      color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                      size={24}
                      onClick={() => setRating(ratingValue)}
                      onMouseEnter={() => setHover(ratingValue)}
                      onMouseLeave={() => setHover(0)}
                    />
                  );
                })}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border rounded-lg mb-4"
                placeholder="Chia sẻ trải nghiệm của bạn..."
                rows="4"
                required
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!rating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Gửi đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;