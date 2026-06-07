import React from 'react';

const RevenueStats = ({ stats }) => {
  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: stats.totalRevenue.toLocaleString('vi-VN') + '₫',
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.totalOrders.toLocaleString('vi-VN'),
      icon: '📦',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Số sản phẩm bán',
      value: stats.totalItems.toLocaleString('vi-VN'),
      icon: '🍔',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Đơn hàng trung bình',
      value: (stats.totalRevenue / (stats.totalOrders || 1)).toLocaleString('vi-VN') + '₫',
      icon: '📊',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tổng quan doanh thu</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg p-6 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu 30 ngày gần nhất</h3>
        {stats.dailyStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số đơn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.dailyStats.map((day, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {day._id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                      {day.revenue.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {day.orders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>Chưa có dữ liệu doanh thu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueStats;