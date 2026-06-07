import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, clearCart, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { checkoutData } = location.state || {};

  useEffect(() => {
    // Kiểm tra nếu không có checkoutData hoặc user chưa có địa chỉ/phone
    if (!checkoutData || !user) {
      navigate('/cart');
      return;
    }

    // Kiểm tra nếu user chưa có địa chỉ hoặc phone nào
    const hasAddresses = user.addresses && user.addresses.length > 0;
    const hasPhones = user.phones && user.phones.length > 0;
    const hasLegacyData = user.address || user.phone;

    if (!hasAddresses && !hasPhones && !hasLegacyData) {
      navigate('/profile', { 
        state: { 
          message: 'Vui lòng cập nhật địa chỉ và số điện thoại trước khi thanh toán',
          returnTo: '/cart'
        }
      });
      return;
    }
  }, [checkoutData, user, navigate]);

  const handlePayment = async () => {
    if (!checkoutData) {
      navigate('/cart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cart.items,
        shippingAddress: checkoutData.selectedAddress,
        phone: checkoutData.selectedPhone,
        paymentMethod: checkoutData.paymentMethod,
        totalAmount: checkoutData.total
      };

      if (checkoutData.paymentMethod === 'vietqr') {
        // Tạo giao dịch VietQR
        const response = await authAPI.get('/vietqr/create-transaction', {
          params: {
            orderId: checkoutData.tempOrderId || `temp_${Date.now()}`,
            amount: checkoutData.total,
            description: `Thanh toan don hang ${checkoutData.tempOrderId || 'temp'}`
          }
        });

        if (response.data.success) {
          navigate('/qr-payment', {
            state: {
              qrData: response.data.transaction,
              orderData: orderData
            }
          });
        } else {
          setError('Không thể tạo mã QR thanh toán');
        }
      } else {
        // Thanh toán COD
        const response = await authAPI.post('/orders', orderData);
        
        if (response.data.success) {
          clearCart();
          navigate('/orders', {
            state: { message: 'Đặt hàng thành công!' }
          });
        } else {
          setError('Có lỗi xảy ra khi đặt hàng');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Xác nhận thanh toán</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Thông tin đơn hàng */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin đơn hàng</h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Địa chỉ giao hàng:</p>
                  <p className="font-medium">{checkoutData.selectedAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại:</p>
                  <p className="font-medium">{checkoutData.selectedPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phương thức thanh toán:</p>
                  <p className="font-medium">
                    {checkoutData.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản QR'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng tiền:</p>
                  <p className="font-bold text-lg text-red-600">
                    {checkoutData.total?.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Sản phẩm đã đặt</h3>
            <div className="space-y-4">
              {cart.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Số lượng: {item.quantity} x {item.product.price.toLocaleString('vi-VN')}đ
                    </p>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Topping: {item.toppings.map(t => t.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {((item.product.price * item.quantity) + 
                        (item.toppings?.reduce((sum, t) => sum + (t.price * t.quantity), 0) || 0)
                      ).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nút thanh toán */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/cart')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Quay lại
            </button>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;