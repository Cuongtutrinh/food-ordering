import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const { user, updateProfile, addAddress, addPhone, updateAddress, updatePhone, deleteAddress, deletePhone } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    delivered: 0,
    delivering: 0,
    cancelled: 0,
    pending: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // States for addresses and phones - Sử dụng từ context thay vì local state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingPhone, setEditingPhone] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    address: '',
    isDefault: false
  });
  const [phoneForm, setPhoneForm] = useState({
    label: '',
    phone: '',
    isDefault: false
  });

  // Cập nhật form data khi user thay đổi
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Fetch order statistics
  useEffect(() => {
    fetchOrderStats();
  }, []);

  const fetchOrderStats = async () => {
    try {
      const response = await authAPI.get('/orders/my-orders');
      const orders = response.data;
      
      const stats = {
      totalOrders: orders.length,
      delivered: orders.filter(order => order.orderStatus === 'delivered').length,
      delivering: orders.filter(order => 
        order.orderStatus === 'shipping' || order.orderStatus === 'delivering' // ✅ Chấp nhận cả 2 giá trị
      ).length,
      cancelled: orders.filter(order => order.orderStatus === 'cancelled').length,
      pending: orders.filter(order => 
        order.orderStatus === 'pending' || 
        order.orderStatus === 'confirmed' || 
        order.orderStatus === 'preparing'
      ).length
      };
      
      setOrderStats(stats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
      setOrderStats({
      totalOrders: 0,
      delivered: 0,
      delivering: 0,
      cancelled: 0,
      pending: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage('Cập nhật thông tin thành công!');
      toast.success('Cập nhật thông tin thành công!');
    } else {
      setError(result.message);
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  // Address functions - Sử dụng context methods
  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const result = await addAddress(addressForm);
      if (result.success) {
        setAddressForm({ label: '', address: '', isDefault: false });
        setShowAddressForm(false);
        toast.success('Thêm địa chỉ thành công!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm địa chỉ');
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      const result = await updateAddress(editingAddress, addressForm);
      if (result.success) {
        setEditingAddress(null);
        setAddressForm({ label: '', address: '', isDefault: false });
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật địa chỉ');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
      try {
        const result = await deleteAddress(addressId);
        if (result.success) {
          toast.success('Xóa địa chỉ thành công!');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa địa chỉ');
      }
    }
  };

  // Phone functions - Sử dụng context methods
  const handleAddPhone = async (e) => {
    e.preventDefault();
    try {
      const result = await addPhone(phoneForm);
      if (result.success) {
        setPhoneForm({ label: '', phone: '', isDefault: false });
        setShowPhoneForm(false);
        toast.success('Thêm số điện thoại thành công!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm số điện thoại');
    }
  };

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    try {
      const result = await updatePhone(editingPhone, phoneForm);
      if (result.success) {
        setEditingPhone(null);
        setPhoneForm({ label: '', phone: '', isDefault: false });
        toast.success('Cập nhật số điện thoại thành công!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật số điện thoại');
    }
  };

  const handleDeletePhone = async (phoneId) => {
    if (window.confirm('Bạn có chắc muốn xóa số điện thoại này?')) {
      try {
        const result = await deletePhone(phoneId);
        if (result.success) {
          toast.success('Xóa số điện thoại thành công!');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa số điện thoại');
      }
    }
  };

  const startEditAddress = (address) => {
    setEditingAddress(address._id);
    setAddressForm({
      label: address.label,
      address: address.address,
      isDefault: address.isDefault
    });
  };

  const startEditPhone = (phone) => {
    setEditingPhone(phone._id);
    setPhoneForm({
      label: phone.label,
      phone: phone.phone,
      isDefault: phone.isDefault
    });
  };

  // Lấy addresses và phones từ user context
  const addresses = user?.addresses || [];
  const phones = user?.phones || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Thông tin tài khoản</h1>
          <Link
            to="/change-password"
            className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
          >
            Đổi mật khẩu?
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-4">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition duration-200 font-semibold disabled:opacity-50"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </button>
            </form>
          </div>

          {/* Order Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thống kê đơn hàng</h2>
            
            {statsLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{orderStats.totalOrders}</div>
                  <div className="text-sm text-gray-600">Tổng đơn hàng</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
                  <div className="text-sm text-gray-600">Đã giao</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{orderStats.delivering}</div>
                  <div className="text-sm text-gray-600">Đang giao</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{orderStats.pending}</div>
                  <div className="text-sm text-gray-600">Chờ xử lý</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Addresses Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Địa chỉ</h2>
            <button
              onClick={() => setShowAddressForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition duration-200"
            >
              Thêm địa chỉ
            </button>
          </div>

          {/* Address Form */}
          {(showAddressForm || editingAddress) && (
            <form onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhãn địa chỉ
                  </label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                    placeholder="VD: Nhà riêng, Văn phòng"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                    placeholder="Nhập địa chỉ đầy đủ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</label>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition duration-200"
                >
                  {editingAddress ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                    setAddressForm({ label: '', address: '', isDefault: false });
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Address List */}
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address._id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium flex items-center">
                    {address.label}
                    {address.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{address.address}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditAddress(address)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && (
              <p className="text-gray-500 text-center py-4">Chưa có địa chỉ nào</p>
            )}
          </div>
        </div>

        {/* Phones Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Số điện thoại</h2>
            <button
              onClick={() => setShowPhoneForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition duration-200"
            >
              Thêm số điện thoại
            </button>
          </div>

          {/* Phone Form */}
          {(showPhoneForm || editingPhone) && (
            <form onSubmit={editingPhone ? handleUpdatePhone : handleAddPhone} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhãn số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phoneForm.label}
                    onChange={(e) => setPhoneForm({...phoneForm, label: e.target.value})}
                    placeholder="VD: Số chính, Số dự phòng"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phoneForm.phone}
                    onChange={(e) => setPhoneForm({...phoneForm, phone: e.target.value})}
                    placeholder="Nhập số điện thoại"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  checked={phoneForm.isDefault}
                  onChange={(e) => setPhoneForm({...phoneForm, isDefault: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Đặt làm số điện thoại mặc định</label>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition duration-200"
                >
                  {editingPhone ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhoneForm(false);
                    setEditingPhone(null);
                    setPhoneForm({ label: '', phone: '', isDefault: false });
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Phone List */}
          <div className="space-y-3">
            {phones.map((phone) => (
              <div key={phone._id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium flex items-center">
                    {phone.label}
                    {phone.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{phone.phone}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditPhone(phone)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeletePhone(phone._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
            {phones.length === 0 && (
              <p className="text-gray-500 text-center py-4">Chưa có số điện thoại nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;