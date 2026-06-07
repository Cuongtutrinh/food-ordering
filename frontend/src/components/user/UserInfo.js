import React from 'react';

const UserInfo = ({ user }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin tài khoản</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600 font-medium">Họ và tên:</span>
          <span className="text-gray-900">{user.name}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600 font-medium">Email:</span>
          <span className="text-gray-900">{user.email}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600 font-medium">Số điện thoại:</span>
          <span className="text-gray-900">{user.phone || 'Chưa cập nhật'}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600 font-medium">Địa chỉ:</span>
          <span className="text-gray-900 text-right max-w-xs">
            {user.address || 'Chưa cập nhật'}
          </span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600 font-medium">Vai trò:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'admin' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
          </span>
        </div>
        
        <div className="flex items-center justify-between py-3">
          <span className="text-gray-600 font-medium">Tham gia từ:</span>
          <span className="text-gray-900">
            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;