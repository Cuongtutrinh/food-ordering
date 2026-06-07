import React from 'react';
import { FaStar } from 'react-icons/fa';

const ReviewList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
        <p className="text-lg">📭 Chưa có đánh giá nào cho sản phẩm này</p>
        <p className="text-sm mt-2">Hãy là người đầu tiên đánh giá!</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">
        💬 Đánh giá từ khách hàng ({reviews.length})
      </h3>
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="border-b pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {review.user?.name || 'Khách hàng'}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      color={index < review.rating ? "#ffc107" : "#e4e5e9"}
                      size={16}
                    />
                  ))}
                </div>
              </div>
              
              <span className="text-sm text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;