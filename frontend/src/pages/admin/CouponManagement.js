import React, { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountAmount: '',
    description: '',
    minOrderAmount: '0',
    maxUsage: '',
    expiresAt: '',
    allowedUserIds: []
  });

  useEffect(() => {
    fetchCoupons();
    fetchUsers();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await authAPI.get('/coupons');
      if (res.data?.success) {
        setCoupons(res.data.coupons);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách mã');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authAPI.get('/users');
      if (res.data?.success) {
        setUsers(res.data.users.filter(u => u.role !== 'admin'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.discountAmount) {
      toast.error('Vui lòng nhập mã và số tiền giảm');
      return;
    }

    try {
      const payload = {
        code: formData.code, // ✅ Giữ nguyên chữ hoa/thường
        discountAmount: Number(formData.discountAmount),
        description: formData.description,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
        expiresAt: formData.expiresAt || null,
        allowedUserIds: formData.allowedUserIds
      };

      let res;
      if (editingCoupon) {
        res = await authAPI.put(`/coupons/${editingCoupon._id}`, payload);
      } else {
        res = await authAPI.post('/coupons', payload);
      }

      if (res.data?.success) {
        toast.success(editingCoupon ? 'Cập nhật thành công' : 'Tạo mã thành công');
        setShowModal(false);
        resetForm();
        fetchCoupons();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi lưu mã');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountAmount: coupon.discountAmount.toString(),
      description: coupon.description || '',
      minOrderAmount: coupon.minOrderAmount.toString(),
      maxUsage: coupon.maxUsage?.toString() || '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
      allowedUserIds: coupon.allowedUsers.map(u => u._id)
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mã này?')) return;

    try {
      const res = await authAPI.delete(`/coupons/${id}`);
      if (res.data?.success) {
        toast.success('Đã xóa mã');
        fetchCoupons();
      }
    } catch (error) {
      toast.error('Lỗi xóa mã');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountAmount: '',
      description: '',
      minOrderAmount: '0',
      maxUsage: '',
      expiresAt: '',
      allowedUserIds: []
    });
    setEditingCoupon(null);
  };

  const toggleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      allowedUserIds: prev.allowedUserIds.includes(userId)
        ? prev.allowedUserIds.filter(id => id !== userId)
        : [...prev.allowedUserIds, userId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý mã giảm giá</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          + Tạo mã mới
        </button>
      </div>

      {/* Danh sách mã */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giảm giá</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã dùng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User được dùng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map(coupon => (
              <tr key={coupon._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono font-bold text-orange-600">{coupon.code}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold">-{coupon.discountAmount.toLocaleString('vi-VN')}₫</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{coupon.description || '-'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm">
                    {coupon.usedCount}/{coupon.maxUsage || '∞'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">
                    {coupon.allowedUsers.length === 0 
                      ? 'Tất cả' 
                      : `${coupon.allowedUsers.length} user`}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${
                    coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {coupon.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(coupon._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCoupon ? 'Cập nhật mã' : 'Tạo mã mới'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mã giảm giá <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                      placeholder="VD: abcED"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">⚠️ Phân biệt chữ hoa/thường</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Số tiền giảm (₫) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="15000"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="2"
                    placeholder="Giảm 15k cho đơn từ 50k"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Đơn tối thiểu (₫)</label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Số lần dùng tối đa</label>
                    <input
                      type="number"
                      value={formData.maxUsage}
                      onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Không giới hạn"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Hết hạn</label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* User selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    User được phép dùng (để trống = tất cả)
                  </label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {users.map(user => (
                      <label key={user._id} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowedUserIds.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                          className="accent-orange-600"
                        />
                        <span className="text-sm">{user.name} ({user.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                  >
                    {editingCoupon ? 'Cập nhật' : 'Tạo mã'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;