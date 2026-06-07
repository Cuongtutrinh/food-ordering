import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const CartSummary = ({
  selectableSubtotal,
  shippingFee,
  total,
  checkoutData,
  setCheckoutData,
  selectedPayment,
  setSelectedPayment,
  onCheckout,
  user,
  selectedCount,
  allCount,
  isProcessing = false,
  appliedCoupon, // ✅ THÊM: Nhận từ Cart.js
  setAppliedCoupon // ✅ THÊM: Nhận từ Cart.js
}) => {
  const navigate = useNavigate();
  const hasUserInfo = user?.addresses?.length > 0 && user?.phones?.length > 0;

  // ✅ THÊM: State cho coupon input (local state)
  const [couponCode, setCouponCode] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // ✅ UPDATED: Validate và áp dụng coupon - gửi selectableSubtotal thay vì total
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    // ✅ Kiểm tra phải có sản phẩm được chọn
    if (!selectableSubtotal || selectableSubtotal <= 0) {
      toast.error('Vui lòng chọn sản phẩm trước khi áp dụng mã');
      return;
    }

    try {
      setCheckingCoupon(true);
      console.log('[CartSummary] Validating coupon:', {
        code: couponCode.trim(),
        orderAmount: selectableSubtotal // ✅ Gửi selectableSubtotal (chưa bao gồm ship)
      });

      const res = await authAPI.post('/coupons/validate', {
        code: couponCode.trim(),
        orderAmount: selectableSubtotal // ✅ FIX: Gửi subtotal thay vì total
      });

      console.log('[CartSummary] Validation response:', res.data);

      if (res.data?.success && res.data?.coupon) {
        setAppliedCoupon(res.data.coupon); // ✅ Lưu vào state của Cart.js
        toast.success(`Áp dụng mã thành công! Giảm ${res.data.coupon.discountAmount.toLocaleString('vi-VN')}₫`);
        setCouponCode(''); // Clear input
      }
    } catch (error) {
      console.error('[CartSummary] Coupon validation error:', error);
      console.error('[CartSummary] Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Mã không hợp lệ');
      setAppliedCoupon(null); // ✅ Clear coupon khi lỗi
    } finally {
      setCheckingCoupon(false);
    }
  };

  // ✅ THÊM: Xóa coupon
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    toast.success('Đã xóa mã giảm giá');
  };

  // ✅ THÊM: Tính tổng sau giảm giá
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAfterDiscount = Math.max(0, selectableSubtotal - discountAmount);
  const finalTotal = totalAfterDiscount + shippingFee;

  const handleAddressChange = (id) => {
    const addr = user.addresses.find(a => a._id === id);
    setCheckoutData(prev => ({
      ...prev,
      selectedAddressId: id,
      shippingAddress: addr ? addr.address : ''
    }));
  };

  const handlePhoneChange = (id) => {
    const ph = user.phones.find(p => p._id === id);
    setCheckoutData(prev => ({
      ...prev,
      selectedPhoneId: id,
      phone: ph ? ph.phone : ''
    }));
  };

  // ✅ GIỮ NGUYÊN: Logic checkout của bạn
  const handleCheckoutClick = () => {
    if (selectedCount === 0) {
      alert('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    if (!hasUserInfo) {
      navigate('/profile');
      return;
    }
    if (!checkoutData.selectedAddressId || !checkoutData.selectedPhoneId) {
      alert('Vui lòng chọn địa chỉ và số điện thoại');
      return;
    }
    // ✅ Gọi onCheckout (couponCode đã được gửi trong Cart.js payload)
    onCheckout();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">Tổng quan đơn hàng</h2>
      <p className="text-sm text-gray-600 mb-4">
        Đã chọn {selectedCount}/{allCount} sản phẩm
      </p>

      {/* ✅ THÊM: Coupon Input Section - CHỈ hiển thị khi có sản phẩm */}
      {selectedCount > 0 && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎟️ Mã giảm giá
          </label>
          
          {!appliedCoupon ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                placeholder="Nhập mã (VD: ABCED)"
                className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                disabled={checkingCoupon || isProcessing}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCoupon();
                  }
                }}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={checkingCoupon || !couponCode.trim() || isProcessing}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {checkingCoupon ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Áp dụng'
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div>
                <p className="font-mono font-bold text-green-700">{appliedCoupon.code}</p>
                <p className="text-sm text-green-600">
                  -{appliedCoupon.discountAmount.toLocaleString('vi-VN')}₫
                </p>
                {appliedCoupon.description && (
                  <p className="text-xs text-gray-600 mt-1">{appliedCoupon.description}</p>
                )}
              </div>
              <button
                onClick={handleRemoveCoupon}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ UPDATED: Order Summary với discount */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Tạm tính (đã chọn):</span>
          <span className="font-semibold">
            {selectableSubtotal.toLocaleString('vi-VN')}₫
          </span>
        </div>

        {/* ✅ THÊM: Hiển thị discount nếu có */}
        {appliedCoupon && discountAmount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Giảm giá ({appliedCoupon.code}):</span>
            <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Phí giao hàng:</span>
          <span className="font-semibold">
            {selectedCount > 0 ? shippingFee.toLocaleString('vi-VN') : '0'}₫
          </span>
        </div>

        <div className="border-t pt-3 flex justify-between text-lg">
          <span className="font-semibold text-gray-900">Tổng cộng:</span>
          <span className="font-bold text-orange-600">
            {finalTotal.toLocaleString('vi-VN')}₫
          </span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h3 className="font-semibold text-orange-800 mb-3">Thông tin giao hàng</h3>
        {hasUserInfo ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ *
              </label>
              <select
                value={checkoutData.selectedAddressId || ''}
                onChange={(e) => handleAddressChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-orange-500"
                disabled={isProcessing}
              >
                <option value="">Chọn địa chỉ</option>
                {user.addresses.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.label} - {a.address}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại *
              </label>
              <select
                value={checkoutData.selectedPhoneId || ''}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-orange-500"
                disabled={isProcessing}
              >
                <option value="">Chọn số điện thoại</option>
                {user.phones.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.label} - {p.phone}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="text-orange-600 hover:text-orange-700 text-sm underline"
              disabled={isProcessing}
            >
              + Thêm địa chỉ / số điện thoại
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-orange-700 mb-2 text-sm">Chưa có thông tin giao hàng</p>
            <button
              onClick={() => navigate('/profile')}
              className="text-orange-600 hover:text-orange-700 underline text-sm"
              disabled={isProcessing}
            >
              Cập nhật ngay
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Phương thức thanh toán</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={selectedPayment === 'cod'}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="accent-orange-600"
              disabled={isProcessing}
            />
            <span className="text-gray-700">💵 Thanh toán khi nhận hàng</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="payment"
              value="qrcode"
              checked={selectedPayment === 'qrcode'}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="accent-orange-600"
              disabled={isProcessing}
            />
            <span className="text-gray-700">📱 Thanh toán với QR Code</span>
          </label>
        </div>
      </div>

      <button
        onClick={handleCheckoutClick}
        disabled={
          isProcessing ||
          selectedCount === 0 ||
          (hasUserInfo && (!checkoutData.selectedAddressId || !checkoutData.selectedPhoneId))
        }
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Đang xử lý...</span>
          </>
        ) : (
          <span>{selectedPayment === 'qrcode' ? 'Thanh toán QR' : 'Đặt hàng'}</span>
        )}
      </button>

      {selectedCount === 0 && (
        <p className="text-xs text-center text-gray-500 mt-3">
          * Vui lòng chọn sản phẩm để thanh toán
        </p>
      )}
    </div>
  );
};

export default CartSummary;