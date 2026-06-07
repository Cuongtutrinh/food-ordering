import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { authAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const ReviewForm = ({ productId, onSubmitReview }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // ✅ THÊM: State kiểm tra quyền review
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Kiểm tra quyền review khi component mount
  useEffect(() => {
    checkReviewStatus();
  }, [productId]);

  const checkReviewStatus = async () => {
    try {
      const res = await authAPI.get(`/reviews/can-review/${productId}`);
      
      if (res.data?.success) {
        setCanReview(res.data.canReview);
        setHasReviewed(res.data.hasReviewed);
        
        if (res.data.hasReviewed && res.data.review) {
          setUserReview(res.data.review);
        }
      }
    } catch (error) {
      console.error('Check review status error:', error);
      // Nếu chưa đăng nhập hoặc lỗi, ẩn form
      setCanReview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    if (!rating) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setSubmitting(true);

      const res = await authAPI.post('/reviews', {
        productId,
        rating,
        comment: comment.trim()
      });

      if (res.data?.success) {
        toast.success('Đánh giá thành công!');
        setHasReviewed(true);
        setCanReview(false);
        setUserReview(res.data.review);
        
        // Reset form
        setRating(0);
        setComment('');
        
        // Gọi callback để refresh danh sách reviews
        if (onSubmitReview) {
          onSubmitReview(res.data.review);
        }
      }

    } catch (error) {
      console.error('Submit review error:', error);
      const message = error.response?.data?.message || 'Lỗi gửi đánh giá';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Đang loading
  if (loading) {
    return (
      <div className="p-4 border rounded-lg mb-6 text-center">
        <div className="animate-pulse">Đang kiểm tra...</div>
      </div>
    );
  }

  // ✅ Đã đánh giá rồi
  if (hasReviewed && userReview) {
    return (
      <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-700 font-semibold">✅ Bạn đã đánh giá sản phẩm này</span>
        </div>
        
        <div className="flex mb-2">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index}
              color={index < userReview.rating ? "#ffc107" : "#e4e5e9"}
              size={20}
            />
          ))}
        </div>
        
        <p className="text-gray-700 mb-2">{userReview.comment}</p>
        
        <p className="text-xs text-gray-500">
          Đánh giá lúc: {new Date(userReview.createdAt).toLocaleString('vi-VN')}
        </p>
      </div>
    );
  }

  // ✅ Chưa có quyền đánh giá
  if (!canReview) {
    return (
      <div className="p-4 border rounded-lg mb-6 bg-gray-50 text-center">
        <p className="text-gray-600">
          📦 Bạn cần mua và nhận hàng để có thể đánh giá sản phẩm này
        </p>
      </div>
    );
  }

  // ✅ Form đánh giá (chỉ hiện khi có quyền và chưa đánh giá)
  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg mb-6 bg-orange-50">
      <h3 className="text-lg font-semibold mb-4">✍️ Viết đánh giá của bạn</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Đánh giá:</label>
        <div className="flex gap-1">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <FaStar
                key={index}
                className="cursor-pointer transition-colors"
                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                size={28}
                onClick={() => setRating(ratingValue)}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(0)}
              />
            );
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              ({rating}/5 sao)
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Nội dung:</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
          rows="4"
          required
          disabled={submitting}
        />
      </div>

      <button 
        type="submit"
        className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        disabled={!rating || !comment.trim() || submitting}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Đang gửi...
          </span>
        ) : (
          '📤 Gửi đánh giá'
        )}
      </button>
    </form>
  );
};

export default ReviewForm;