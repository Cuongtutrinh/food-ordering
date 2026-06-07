import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ToppingManagement = () => {
  const [toppings, setToppings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopping, setEditingTopping] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'sauce',
    description: '',
    available: true
  });

  useEffect(() => {
    fetchToppings();
  }, []);

  const fetchToppings = async () => {
    try {
      const response = await authAPI.get('/toppings');
      setToppings(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách topping:', error);
      toast.error('Không thể tải danh sách topping');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTopping) {
        await authAPI.put(`/toppings/${editingTopping._id}`, formData);
        toast.success('Cập nhật topping thành công!');
      } else {
        await authAPI.post('/toppings', formData);
        toast.success('Thêm topping thành công!');
      }
      
      fetchToppings();
      setShowForm(false);
      setEditingTopping(null);
      setFormData({
        name: '',
        price: '',
        category: 'sauce',
        description: '',
        available: true
      });
    } catch (error) {
      console.error('Lỗi khi lưu topping:', error);
      toast.error('Có lỗi xảy ra khi lưu topping');
    }
  };

  const handleEdit = (topping) => {
    setEditingTopping(topping);
    setFormData({
      name: topping.name,
      price: topping.price.toString(),
      category: topping.category,
      description: topping.description || '',
      available: topping.available
    });
    setShowForm(true);
  };

  const handleDelete = async (toppingId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa topping này?')) {
      try {
        await authAPI.delete(`/toppings/${toppingId}`);
        toast.success('Xóa topping thành công!');
        fetchToppings();
      } catch (error) {
        console.error('Lỗi khi xóa topping:', error);
        toast.error('Có lỗi xảy ra khi xóa topping');
      }
    }
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingTopping(null);
    setFormData({
      name: '',
      price: '',
      category: 'sauce',
      description: '',
      available: true
    });
  };

  const getCategoryName = (category) => {
    const categories = {
      sauce: 'Nước sốt',
      meat: 'Thịt',
      vegetable: 'Rau củ',
      cheese: 'Phô mai',
      other: 'Khác'
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Topping</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
        >
          <FaPlus className="mr-2" />
          Thêm topping mới
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingTopping ? 'Chỉnh sửa topping' : 'Thêm topping mới'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên topping
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VND)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="sauce">Nước sốt</option>
                  <option value="meat">Thịt</option>
                  <option value="vegetable">Rau củ</option>
                  <option value="cheese">Phô mai</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Mô tả topping..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Có sẵn
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingTopping ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {toppings.map((topping) => (
          <div key={topping._id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg text-gray-800">{topping.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(topping)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(topping._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-orange-600 font-semibold">
                {topping.price.toLocaleString('vi-VN')}₫
              </p>
              
              <p className="text-sm text-gray-600">
                Danh mục: {getCategoryName(topping.category)}
              </p>

              {topping.description && (
                <p className="text-sm text-gray-600">{topping.description}</p>
              )}

              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                topping.available 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {topping.available ? 'Có sẵn' : 'Hết hàng'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {toppings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Chưa có topping nào được thêm</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Thêm topping đầu tiên
          </button>
        </div>
      )}
    </div>
  );
};

export default ToppingManagement;