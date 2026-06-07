import React, { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';
import ProductManagement from './ProductManagement';
import ToppingManagement from './ToppingManagement';
import OrderManagement from './OrderManagement';
import RevenueStats from './RevenueStats';
import CouponManagement from './CouponManagement';


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await authAPI.get('/orders/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Các tab chính cho admin
  const tabs = [
    { id: 'stats', name: 'Thống kê', icon: '📊' },
    { id: 'products', name: 'Quản lý sản phẩm', icon: '🍔' },
    { id: 'toppings', name: 'Quản lý Topping', icon: '🧄' },
    { id: 'orders', name: 'Quản lý đơn hàng', icon: '📦' },
    { id: 'coupons', name: 'Quản lý mã giảm giá', icon: '💰' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Quản lý hệ thống FoodOrder</p>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Tabs - Chỉ hiển thị 3 tab chính */}
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition duration-200 ${
                  activeTab === tab.id
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'stats' && <RevenueStats stats={stats} />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'toppings' && <ToppingManagement />}
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'coupons' && <CouponManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;