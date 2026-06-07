import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';

const Cart = () => {
  const {
    cart,
    user,
    updateCartItem,
    removeFromCart,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    getSelectedItems,
    removeSelectedItems,
    removeProductsById
  } = useAuth();

  const [checkoutData, setCheckoutData] = useState({
    selectedAddressId: '',
    selectedPhoneId: '',
    shippingAddress: '',
    phone: ''
  });
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  // ✅ THÊM: State cho coupon
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const navigate = useNavigate();

  // ✅ THÊM: Check pending payment intent khi component mount
  useEffect(() => {
    const checkPendingIntent = async () => {
      const pendingIntentId = localStorage.getItem('pendingQRIntentId');
      
      if (!pendingIntentId) return;

      console.log('[Cart] Found pending intent:', pendingIntentId);

      try {
        // Kiểm tra trạng thái của intent
        const res = await authAPI.get(`/vietqr/check-status/${pendingIntentId}`);
        
        if (res.data?.success) {
          const tx = res.data.transaction;
          
          if (tx.status === 'PAID') {
            // Đã thanh toán thành công
            toast.success('Đơn hàng trước đó đã được thanh toán thành công!');
            localStorage.removeItem('pendingQRIntentId');
            navigate('/orders');
            return;
          }
          
          if (tx.status === 'PENDING') {
            // Vẫn đang chờ thanh toán
            const shouldResume = window.confirm(
              '🔔 Bạn có một giao dịch thanh toán đang chờ xử lý.\n\n' +
              `Mã GD: ${tx.referenceCode}\n` +
              `Số tiền: ${tx.totalAmount.toLocaleString('vi-VN')}₫\n\n` +
              'Bạn có muốn tiếp tục kiểm tra trạng thái thanh toán không?'
            );
            
            if (shouldResume) {
              navigate(`/qr-payment?intentId=${pendingIntentId}`);
              return;
            } else {
              try {
                  console.log('[Cart] Cancelling pending intent:', pendingIntentId);
                  await authAPI.post(`/vietqr/intent/${pendingIntentId}/cancel`);
                  localStorage.removeItem('pendingQRIntentId');
                  toast.success('Đã hủy giao dịch');
                } catch (cancelError) {
                  console.error('[Cart] Error cancelling intent:', cancelError);
                  toast.error('Lỗi khi hủy giao dịch');
                  // ✅ Vẫn xóa pending intent nếu lỗi
                  localStorage.removeItem('pendingQRIntentId');
                }
              return;
            }
          }
          
          if (tx.status === 'EXPIRED' || tx.status === 'CANCELLED') {
            // Intent đã hết hạn hoặc bị hủy
            localStorage.removeItem('pendingQRIntentId');
            toast('Giao dịch trước đó đã ' + (tx.status === 'EXPIRED' ? 'hết hạn' : 'bị hủy'));
          }
        }
      } catch (error) {
        console.error('[Cart] Error checking pending intent:', error);
        // Nếu lỗi, xóa pending intent
        localStorage.removeItem('pendingQRIntentId');
      }
    };

    checkPendingIntent();
  }, [navigate]); // Chỉ chạy 1 lần khi mount

  // useEffect hiện tại cho user info
  useEffect(() => {
    if (user?.addresses?.length && user?.phones?.length) {
      const defAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      const defPhone = user.phones.find(p => p.isDefault) || user.phones[0];
      setCheckoutData({
        selectedAddressId: defAddr._id,
        selectedPhoneId: defPhone._id,
        shippingAddress: defAddr.address,
        phone: defPhone.phone
      });
    }
  }, [user]);

  const handleQuantityChange = (productId, qty) => updateCartItem(productId, qty);
  const handleRemoveItem = (productId) => removeFromCart(productId);
  const handleToggleSelect = (productId, toppings) => toggleItemSelection(productId, toppings);

  const selectedItems = getSelectedItems();

  const selectableSubtotal = selectedItems.reduce((sum, item) => {
    const base = item.product.price * item.quantity;
    const toppingsTotal = (item.toppings || []).reduce(
      (tSum, t) => tSum + t.price * t.quantity * item.quantity,
      0
    );
    return sum + base + toppingsTotal;
  }, 0);

  const shippingFee = selectedItems.length > 0 ? 15000 : 0;
  
  // ✅ THÊM: Tính discount và total cuối cùng
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAfterDiscount = Math.max(0, selectableSubtotal - discountAmount);
  const total = totalAfterDiscount + shippingFee;

  const proceedToPayment = async () => {
    if (isProcessing) {
      console.log('[Cart] Already processing, ignoring click');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    if (!checkoutData.shippingAddress || !checkoutData.phone) {
      toast.error('Vui lòng chọn địa chỉ và số điện thoại');
      return;
    }

    setIsProcessing(true);

    const payload = {
      items: selectedItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        toppings: (item.toppings || []).map(t => ({
          _id: t._id || null,
          name: t.name || '',
          quantity: t.quantity || 1,
          price: t.price || 0
        }))
      })),
      shippingAddress: checkoutData.shippingAddress,
      phone: checkoutData.phone,
      notes: '',
      selectedAddressId: checkoutData.selectedAddressId,
      selectedPhoneId: checkoutData.selectedPhoneId,
      couponCode: appliedCoupon?.code || null // ✅ THÊM: Gửi coupon code
    };

    if (selectedPayment === 'qrcode') {
      try {
        console.log('[Cart] Creating VietQR intent...');
        localStorage.removeItem('pendingQRIntentId');

        const res = await authAPI.post('/vietqr/intent', payload);
        console.log('[Cart] Intent response:', res.data);

        if (res.data?.success && res.data.transaction?._id) {
          const intentId = res.data.transaction._id;
          console.log('[Cart] Intent created successfully:', intentId);
          
          localStorage.setItem('pendingQRIntentId', intentId);
          
          navigate(`/qr-payment?intentId=${intentId}`, {
            state: { 
              selectedProductIds: selectedItems.map(i => i.product._id),
              fromCart: true
            },
            replace: true
          });
        } else {
          console.error('[Cart] Invalid intent response:', res.data);
          toast.error(res.data?.message || 'Không thể tạo yêu cầu thanh toán VietQR.');
          setIsProcessing(false);
        }
      } catch (e) {
        console.error('[Cart] Error creating intent:', e);
        toast.error(e.response?.data?.message || 'Lỗi khi tạo yêu cầu thanh toán VietQR.');
        setIsProcessing(false);
      }
    } else if (selectedPayment === 'cod') {
      try {
        console.log('[Cart] Creating COD order...');
        const res = await authAPI.post('/orders', { ...payload, paymentMethod: 'cod' });
        if (res.data?.success) {
          toast.success('Đặt hàng thành công!');
          removeSelectedItems();
          navigate('/orders');
        } else {
          toast.error(res.data?.message || 'Không thể đặt hàng.');
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Lỗi khi đặt hàng.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      toast.error('Vui lòng chọn phương thức thanh toán.');
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-8">Hãy thêm món vào giỏ hàng!</p>
            <Link
              to="/"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allSelected = selectedItems.length === cart.items.length && cart.items.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng của bạn</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Sản phẩm ({cart.items.reduce((t, i) => t + i.quantity, 0)})
                </h2>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-orange-600"
                    checked={allSelected}
                    onChange={(e) => selectAllItems(e.target.checked)}
                  />
                  <span>Chọn tất cả</span>
                </label>
              </div>

              <div className="divide-y">
                {cart.items.map(item => (
                  <CartItem
                    key={item.product._id + JSON.stringify(item.toppings)}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>

              <div className="p-6 border-t flex justify-between items-center">
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa tất cả sản phẩm
                </button>
                <span className="text-sm text-gray-500">
                  Đã chọn: {selectedItems.length}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <CartSummary
              selectableSubtotal={selectableSubtotal}
              shippingFee={shippingFee}
              total={total}
              checkoutData={checkoutData}
              setCheckoutData={setCheckoutData}
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              onCheckout={proceedToPayment}
              user={user}
              selectedCount={selectedItems.length}
              allCount={cart.items.length}
              isProcessing={isProcessing}
              appliedCoupon={appliedCoupon} // ✅ THÊM: Truyền appliedCoupon
              setAppliedCoupon={setAppliedCoupon} // ✅ THÊM: Truyền setAppliedCoupon
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;