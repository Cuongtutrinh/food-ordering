import React, { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api'; 

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await authAPI.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', { orderId, newStatus });

      const response = await authAPI.put(`/orders/${orderId}/status`, { 
        orderStatus: newStatus,
        shouldSendEmail: newStatus === 'delivered'
      });

      console.log('Update response:', response.data);

      if (response.data.success) {
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, ...response.data.data }
            : order
        ));
      } else {
        throw new Error(response.data.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      alert(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': '#ffa500',
      'confirmed': '#32cd32', 
      'preparing': '#1e90ff',
      'shipping': '#ff6347',
      'delivering': '#ff4500',
      'delivered': '#228b22',
      'cancelled': '#dc143c'
    };
    return statusMap[status] || '#666';
  };

  // ✅ FIX: Thêm return statement và [status]
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'preparing': 'Đang chuẩn bị', 
      'shipping': 'Đang giao hàng',
      'delivering': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status; // ✅ FIX: Thêm return và [status]
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['delivering'],
      'delivering': ['delivered'],
      'delivered': [],
      'cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  const getStatusActionText = (nextStatus) => {
    const actionMap = {
      'confirmed': 'Xác nhận đơn hàng',
      'preparing': 'Bắt đầu chuẩn bị',
      'delivering': 'Bắt đầu giao hàng',
      'delivered': 'Xác nhận đã giao',
      'cancelled': 'Hủy đơn hàng'
    };
    return actionMap[nextStatus] || nextStatus;
  };

  const getPaymentStatusColor = (order) => {
    if (order.paymentMethod === 'qrcode') {
      switch (order.paymentStatus) {
        case 'paid':
          return 'bg-green-100 text-green-800';
        case 'waiting_confirmation':
          return 'bg-orange-100 text-orange-800';
        case 'cancelled':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-yellow-100 text-yellow-800';
      }
    }
    else if (order.paymentMethod === 'cod') {
      return order.orderStatus === 'delivered'
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusText = (order) => {
    if (order.paymentMethod === 'qrcode') {
      switch (order.paymentStatus) {
        case 'paid':
          return 'Đã thanh toán';
        case 'waiting_confirmation':
          return 'Chờ xác nhận thanh toán';
        case 'cancelled':
          return 'Đã hủy thanh toán';
        default:
          return 'Chờ thanh toán';
      }
    }
    else if (order.paymentMethod === 'cod') {
      return order.orderStatus === 'delivered' ? 'Đã thanh toán' : 'Chờ thanh toán';
    }
    return 'Không xác định';
  };

  const getPaymentMethodText = (paymentMethod) => {
    switch (paymentMethod) {
      case 'cod':
        return 'Thanh toán khi nhận hàng';
      case 'qrcode':
        return 'Thanh toán QR Code';
      default:
        return paymentMethod;
    }
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort orders by creation date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý đơn hàng</h2>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hàng, tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="preparing">Đang chuẩn bị</option>
          <option value="delivering">Đang giao hàng</option>
          <option value="delivered">Đã giao hàng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'].map(status => {
          const count = orders.filter(order => order.orderStatus === status).length;
          return (
            <div
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                statusFilter === status
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <div className="text-sm font-medium text-gray-600">{getStatusText(status)}</div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Orders list */}
      {sortedOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
          <p className="text-gray-600">Các đơn hàng sẽ xuất hiện ở đây khi khách hàng đặt món.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedOrders.map(order => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
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
      
      {/* ✅ Hiển thị thông tin khách hàng với chi tiết */}
      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-600">
          <strong>Khách hàng:</strong> {order.user.name}
        </p>
        
        {/* ✅ Hiển thị số điện thoại với label nếu có */}
        <p className="text-sm text-gray-600">
          <strong>Số điện thoại:</strong> 
          {order.phoneDetails ? (
            <span className="ml-1">
              {order.phoneDetails.phone} 
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-1">
                {order.phoneDetails.label}
              </span>
            </span>
          ) : (
            <span className="ml-1">{order.phone}</span>
          )}
        </p>
        
        {/* ✅ Hiển thị địa chỉ với label nếu có */}
        <p className="text-sm text-gray-600">
          <strong>Địa chỉ giao:</strong> 
          {order.shippingAddressDetails ? (
            <span className="ml-1">
              {order.shippingAddressDetails.address}
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-1">
                {order.shippingAddressDetails.label}
              </span>
            </span>
          ) : (
            <span className="ml-1">{order.shippingAddress}</span>
          )}
        </p>
      </div>
      
      <p className="text-sm text-gray-600 mt-1">
        <strong>Phương thức thanh toán:</strong> {getPaymentMethodText(order.paymentMethod)}
      </p>
    </div>
    
    <div className="mt-2 lg:mt-0 flex flex-col space-y-2">
      <span 
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: getStatusColor(order.orderStatus) }}
      >
        {getStatusText(order.orderStatus)}
      </span>
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order)}`}>
        {getPaymentStatusText(order)}
      </span>
    </div>
  </div>
</div>

              <div className="p-6">
<div className="space-y-4 mb-6">
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

    // ✅ Tính tổng giá bao gồm toppings cho admin
    const basePrice = item.price * item.quantity;
    const toppingsPrice = (item.toppings || []).reduce((total, topping) => {
      return total + (topping.price * topping.quantity * item.quantity);
    }, 0);
    const totalItemPrice = basePrice + toppingsPrice;

    return (
      <div key={index} className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <img 
            src={item.product.image} 
            alt={item.product.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
            }}
          />
          <div>
            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
            <p className="text-gray-600 text-sm">
              {item.price.toLocaleString('vi-VN')}₫ × {item.quantity}
            </p>
            
            {/* ✅ Admin cũng thấy toppings */}
            {item.toppings && item.toppings.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-500 mb-1">Toppings:</p>
                <div className="flex flex-wrap gap-1">
                  {item.toppings.map((topping, toppingIndex) => (
                    <span 
                      key={toppingIndex} 
                      className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {topping.name} x{topping.quantity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {totalItemPrice.toLocaleString('vi-VN')}₫
          </div>
          {toppingsPrice > 0 && (
            <div className="text-xs text-gray-500">
              (+{toppingsPrice.toLocaleString('vi-VN')}₫ topping)
            </div>
          )}
        </div>
      </div>
    );
  })}
</div>
                <div className="border-t pt-4">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
    <div className="text-sm text-gray-600 mb-4 lg:mb-0 space-y-1">
      {/* ✅ Hiển thị thông tin chi tiết hơn */}
      <div>
        <strong>Thông tin giao hàng:</strong>
      </div>
      <div className="ml-2 space-y-1">
        <p>
          📍 <strong>Địa chỉ:</strong> {order.shippingAddress}
          {order.shippingAddressDetails && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">
              {order.shippingAddressDetails.label}
            </span>
          )}
        </p>
        <p>
          📞 <strong>Số điện thoại:</strong> {order.phone}
          {order.phoneDetails && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">
              {order.phoneDetails.label}
            </span>
          )}
        </p>
      </div>
      <p><strong>Tổng cộng:</strong> <span className="text-orange-600 font-semibold">{order.totalAmount.toLocaleString('vi-VN')}₫</span></p>
    </div>
    
    <div className="flex flex-wrap gap-2">
      {getNextStatus(order.orderStatus).map(nextStatus => (
        <button
          key={nextStatus}
          onClick={() => updateOrderStatus(order._id, nextStatus)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
            nextStatus === 'cancelled'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : nextStatus === 'confirmed'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          {getStatusActionText(nextStatus)}
        </button>
      ))}
    </div>
  </div>
</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;