import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import socket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';

const QRPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { removeProductsById } = useAuth();

  const intentId = searchParams.get('intentId');
  const selectedProductIds = location.state?.selectedProductIds || [];

  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const paidRef = useRef(false);
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // ✅ Update countdown timer
  const updateTimeLeft = useCallback(() => {
    if (!qrData?.expiredAt) return;
    const expiry = moment(qrData.expiredAt);
    const now = moment();
    if (now.isAfter(expiry)) {
      setIsExpired(true);
      setTimeLeft(0);
    } else {
      setTimeLeft(expiry.diff(now, 'seconds'));
    }
  }, [qrData?.expiredAt]);

  // ✅ Initialize
  useEffect(() => {
    if (!intentId) {
      console.error('[QRPayment] No intentId');
      navigate('/cart');
      return;
    }
    console.log('[QRPayment] Initializing with intentId:', intentId);
    fetchTransaction();
  }, [intentId]);

  // ✅ Setup polling & socket listeners
  useEffect(() => {
    if (!intentId || !transaction) return;

    console.log('[QRPayment] Setting up polling and socket listeners');

    // Socket listener
    const handlePaymentSuccess = (data) => {
      console.log('[QRPayment] Socket paymentSuccess:', data);
      if (
        data?.intentId === intentId ||
        data?.userId === transaction.user?.toString() ||
        (data?.orderId && transaction?.order && data.orderId === transaction.order._id)
      ) {
        console.log('[QRPayment] Payment confirmed via socket!');
        finalizePayment();
      }
    };

    socket.on('paymentSuccess', handlePaymentSuccess);

    // Timer for countdown
    timerIntervalRef.current = setInterval(updateTimeLeft, 1000);

    // Polling for status (every 3 seconds)
    pollIntervalRef.current = setInterval(() => {
      if (!paidRef.current && !isExpired) {
        checkPaymentStatus();
      }
    }, 3000);

    // ✅ CLEANUP: CHỈ dừng polling, KHÔNG hủy transaction
    return () => {
      console.log('[QRPayment] Cleanup: stopping intervals only');
      socket.off('paymentSuccess', handlePaymentSuccess);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      // ❌ KHÔNG GỌI cancelSilently() nữa!
    };
  }, [intentId, transaction, isExpired, updateTimeLeft]);

  // ✅ Finalize payment
  const finalizePayment = useCallback(() => {
    if (paidRef.current || paymentConfirmed) {
      console.log('[QRPayment] Already finalized');
      return;
    }

    console.log('[QRPayment] Finalizing payment...');
    paidRef.current = true;
    setPaymentConfirmed(true);

    // Clear cart
    if (selectedProductIds.length) {
      removeProductsById(selectedProductIds);
    }

    // Clear pending intent ID
    localStorage.removeItem('pendingQRIntentId');

    // Show success & redirect
    toast.success('Thanh toán thành công!', { duration: 3000 });
    
    setTimeout(() => {
      navigate('/orders', { replace: true });
    }, 1500);

  }, [paymentConfirmed, selectedProductIds, removeProductsById, navigate]);

  // ✅ Fetch transaction details
  const fetchTransaction = async () => {
    try {
      setLoading(true);
      console.log('[QRPayment] Fetching transaction:', intentId);

      const res = await authAPI.get(`/vietqr/check-status/${intentId}`);
      console.log('[QRPayment] Response:', res.data);

      if (res.data?.success) {
        const tx = res.data.transaction;
        setTransaction(tx);
        setQrData({
          qrCode: tx.qrCode || tx.qrDataURL || '',
          expiredAt: tx.expiredAt
        });
        setIsExpired(tx.status === 'EXPIRED');
        updateTimeLeft();

        // ✅ Nếu đã PAID, finalize ngay
        if (res.data.isPaid || tx.status === 'PAID') {
          console.log('[QRPayment] Already paid!');
          finalizePayment();
        }
      } else {
        toast.error(res.data?.message || 'Không thể tải giao dịch');
        navigate('/cart');
      }
    } catch (e) {
      console.error('[QRPayment] Fetch error:', e);
      toast.error('Lỗi tải giao dịch');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check payment status (polling)
  const checkPaymentStatus = async () => {
    if (!intentId || paidRef.current) return;

    try {
      setCheckingPayment(true);
      console.log('[QRPayment] Polling status...');

      const res = await authAPI.get(`/vietqr/check-status/${intentId}`);
      const tx = res.data.transaction;
      const status = tx?.status;

      console.log('[QRPayment] Status:', status, 'isPaid:', res.data.isPaid);

      if (res.data.isPaid || status === 'PAID') {
        setTransaction(tx);
        finalizePayment();
      } else if (status === 'EXPIRED') {
        setIsExpired(true);
        toast.error('Mã QR đã hết hạn');
      }
    } catch (e) {
      console.error('[QRPayment] Poll error:', e);
    } finally {
      setCheckingPayment(false);
    }
  };

  // ✅ Manual cancel (only when user explicitly clicks)
  const handleCancelPayment = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy thanh toán?\n\nLưu ý: Nếu bạn đã chuyển khoản, vui lòng không hủy!')) {
      return;
    }

    try {
      console.log('[QRPayment] User cancelled payment');
      const res = await authAPI.post(`/vietqr/intent/${intentId}/cancel`);

      if (res.data?.success) {
        toast.success('Đã hủy giao dịch');
      } else {
        toast.error(res.data?.message || 'Không thể hủy');
      }
    } catch (e) {
      console.error('[QRPayment] Cancel error:', e);
      toast.error('Lỗi hủy giao dịch');
    } finally {
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải mã QR...</p>
        </div>
      </div>
    );
  }

  // ✅ THÊM: Tính toán discount từ transaction
  const subtotal = transaction?.order?.items?.reduce((sum, item) => {
    const base = item.price * item.quantity;
    const toppings = (item.toppings || []).reduce((t, tp) => t + tp.price * tp.quantity * item.quantity, 0);
    return sum + base + toppings;
  }, 0) || 0;

  const shippingFee = 15000;
  const discountAmount = transaction?.coupon?.discountAmount || 0;
  const finalTotal = transaction?.totalAmount || (subtotal + shippingFee);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Thanh toán bằng mã QR
          </h1>

          <div className="text-center mb-8">
            {qrData?.qrCode && !isExpired ? (
              <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg">
                <img
                  src={qrData.qrCode}
                  alt="QR Code thanh toán"
                  className="mx-auto mb-4"
                  style={{ maxWidth: '300px', width: '100%' }}
                />
                {timeLeft !== null && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900">
                      Mã QR còn hiệu lực trong:
                    </p>
                    <p className="text-xl font-bold text-orange-600">
                      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </p>
                  </div>
                )}
                {checkingPayment ? (
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang kiểm tra thanh toán...</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Quét mã để thanh toán</p>
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-4">
                  {isExpired ? 'Mã QR đã hết hạn' : 'Không thể tải mã QR'}
                </p>
                <button
                  onClick={fetchTransaction}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  Tải lại
                </button>
              </div>
            )}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">📱 Hướng dẫn thanh toán</h3>
            <ol className="text-sm text-orange-800 space-y-1 ml-4 list-decimal">
              <li>Mở app ngân hàng và quét mã QR bên trên</li>
              <li>
                Kiểm tra số tiền: <strong>{finalTotal.toLocaleString('vi-VN')}₫</strong>
                {/* ✅ THÊM: Hiển thị discount nếu có */}
                {discountAmount > 0 && (
                  <span className="text-green-700 font-medium ml-1">
                    (Đã giảm {discountAmount.toLocaleString('vi-VN')}₫)
                  </span>
                )}
              </li>
              <li>Nội dung chuyển khoản: <strong className="font-mono">FOODORDER {transaction?.referenceCode}</strong></li>
              <li>Xác nhận chuyển khoản</li>
              <li>Đợi hệ thống xác nhận (tự động 3-10 giây)</li>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Thông tin thanh toán</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã giao dịch:</span>
                <span className="font-semibold text-orange-600">
                  {transaction?.referenceCode || '---'}
                </span>
              </div>

              {/* ✅ THÊM: Hiển thị breakdown nếu có discount */}
              {discountAmount > 0 && transaction?.coupon && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span>{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Giảm giá ({transaction.coupon.code}):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí ship:</span>
                    <span>{shippingFee.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="border-t pt-2"></div>
                </>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-bold text-orange-600">
                  {finalTotal.toLocaleString('vi-VN')}₫
                </span>
              </div>
              {transaction?.order && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Đơn hàng:</span>
                  <span className="font-semibold text-green-600">
                    #{String(transaction.order._id).slice(-8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {!paymentConfirmed && !isExpired && (
              <button
                onClick={checkPaymentStatus}
                disabled={checkingPayment}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <span>Kiểm tra thanh toán</span>
                )}
              </button>
            )}
            {!paymentConfirmed && (
              <button
                onClick={handleCancelPayment}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
              >
                Hủy thanh toán
              </button>
            )}
          </div>

          {/* ✅ FIX: Đổi <p> thành <div> để tránh warning DOM nesting */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <div>
              ℹ️ Bạn có thể đóng trang này sau khi chuyển khoản.
            </div>
            <div>
              Đơn hàng sẽ tự động được tạo khi thanh toán thành công.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPayment;