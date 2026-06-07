// ...existing code...
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, publicAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({ items: [] });

  const getCartKey = (currentUser) => currentUser ? `cart_${currentUser._id}` : 'cart_guest';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    let currentUser = null;

    if (token && userData) {
      currentUser = JSON.parse(userData);
      setUser(currentUser);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    }

    const cartKey = getCartKey(currentUser);
    const cartData = localStorage.getItem(cartKey);

    if (cartData) {
      try {
        const parsedCart = JSON.parse(cartData);
        restoreCartWithProducts(parsedCart);
      } catch (e) {
        console.error('Error parsing cart data:', e);
        setCart({ items: [] });
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await authAPI.get('/users/profile');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  };

  const restoreCartWithProducts = async (savedCart) => {
    try {
      const safeCart = savedCart && savedCart.items ? savedCart : { items: [] };
      const response = await publicAPI.get('/products');
      const allProducts = response.data;

      const restoredItems = safeCart.items.map(ci => {
        const product = allProducts.find(p => p._id === ci.productId);
        if (!product) return null;
        return {
          product,
            quantity: ci.quantity,
            toppings: (ci.toppings || []).map(t => ({
              _id: t._id,
              name: t.name,
              quantity: t.quantity || 1,
              price: t.price || 0
            })),
            selected: ci.selected !== undefined ? ci.selected : true
          };
        }).filter(Boolean);

      setCart({ items: restoredItems });
    } catch (e) {
      console.error('Error restoring cart:', e);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (updater) => {
    setCart(prev => {
      const safePrev = prev && prev.items ? prev : { items: [] };
      const newCart = updater(safePrev);

      const currentUserData = localStorage.getItem('user');
      const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
      const cartKey = getCartKey(currentUser);

      const simplified = {
        items: newCart.items.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          toppings: (item.toppings || []).map(t => ({
            _id: t._id,
            name: t.name,
            quantity: t.quantity || 1,
            price: t.price || 0
          })),
          selected: item.selected
        }))
      };
      localStorage.setItem(cartKey, JSON.stringify(simplified));
      return newCart;
    });
  };

  const login = async (email, password, oauthToken = null) => {
    try {
      let response;
      if (oauthToken) {
        response = await authAPI.get('/users/profile', {
          headers: { Authorization: `Bearer ${oauthToken}` }
        });
        localStorage.setItem('token', oauthToken);
        authAPI.defaults.headers.common['Authorization'] = `Bearer ${oauthToken}`;
      } else {
        response = await authAPI.post('/auth/login', { email, password });
        if (!response.data.success) {
          return { success: false, message: response.data.message || 'Đăng nhập thất bại' };
        }
        localStorage.setItem('token', response.data.token);
        authAPI.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      const userData = response.data.user || response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('cart_guest');
      const userCartKey = getCartKey(userData);
      const userCartData = localStorage.getItem(userCartKey);
      const parsedCart = userCartData ? JSON.parse(userCartData) : { items: [] };
      await restoreCartWithProducts(parsedCart);
      setTimeout(fetchUserProfile, 500);
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Đăng nhập thất bại';
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await authAPI.post('/auth/register', userData);
      const { token, ...userInfo } = res.data;
      localStorage.removeItem('cart_guest');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userInfo);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete authAPI.defaults.headers.common['Authorization'];
    setUser(null);
    setCart({ items: [] });
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await authAPI.put('/users/profile', profileData);
      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: res.data.message, user: updatedUser };
      }
      return { success: false, message: res.data.message || 'Cập nhật thất bại' };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };

  // Address / phone methods (unchanged)
  const addAddress = async (data) => {
    try {
      const res = await authAPI.post('/users/addresses', data);
      if (res.data.success) {
        const updatedUser = { ...user, addresses: res.data.addresses };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: 'Thêm địa chỉ thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };
  const updateAddress = async (id, data) => {
    try {
      const res = await authAPI.put(`/users/addresses/${id}`, data);
      if (res.data.success) {
        const updatedUser = { ...user, addresses: res.data.addresses };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: 'Cập nhật địa chỉ thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };
  const deleteAddress = async (id) => {
    try {
      const res = await authAPI.delete(`/users/addresses/${id}`);
      if (res.data.success) {
        const updatedUser = { ...user, addresses: res.data.addresses };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: 'Xóa địa chỉ thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };
  const addPhone = async (data) => {
    try {
      const res = await authAPI.post('/users/phones', data);
      if (res.data.success) {
        const updatedUser = { ...user, phones: res.data.phones };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: 'Thêm số điện thoại thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };
  const updatePhone = async (id, data) => {
    try {
      const res = await authAPI.put(`/users/phones/${id}`, data);
      if (res.data.success) {
        const updatedUser = { ...user, phones: res.data.phones };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: 'Cập nhật số điện thoại thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };
  const deletePhone = async (id) => {
    try {
      const res = await authAPI.delete(`/users/phones/${id}`);
      if (res.data.success) {
        const updatedUser = { ...user, phones: res.data.phones };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: 'Xóa số điện thoại thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const res = await authAPI.put(`/users/addresses/${id}/set-default`);
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true, message: 'Đặt mặc định thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };
  const setDefaultPhone = async (id) => {
    try {
      const res = await authAPI.put(`/users/phones/${id}/set-default`);
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true, message: 'Đặt mặc định thành công' };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Có lỗi xảy ra' };
    }
  };

  // Cart operations
  const addToCart = (product, quantity = 1, toppings = []) => {
    updateCart(prev => {
      const idx = prev.items.findIndex(
        it => it.product._id === product._id &&
          JSON.stringify(it.toppings || []) === JSON.stringify(toppings || [])
      );
      if (idx >= 0) {
        const updated = [...prev.items];
        updated[idx].quantity += quantity;
        return { ...prev, items: updated };
      }
      const safeToppings = (toppings || []).map(t => ({
        _id: t._id || t.id || null,
        name: t.name || '',
        quantity: Number(t.quantity) || 1,
        price: Number(t.price) || 0
      }));
      return {
        ...prev,
        items: [
          ...prev.items,
          { product, quantity, toppings: safeToppings, selected: true }
        ]
      };
    });
  };

  const toggleItemSelection = (productId, toppings = []) => {
    updateCart(prev => ({
      ...prev,
      items: prev.items.map(it => {
        if (it.product._id === productId &&
          JSON.stringify(it.toppings) === JSON.stringify(toppings)) {
          return { ...it, selected: !it.selected };
        }
        return it;
      })
    }));
  };

  const selectAllItems = (selected) => {
    updateCart(prev => ({
      ...prev,
      items: prev.items.map(it => ({ ...it, selected }))
    }));
  };

  const getSelectedItems = () => cart.items.filter(it => it.selected);

  const removeSelectedItems = () => {
    updateCart(prev => ({
      ...prev,
      items: prev.items.filter(it => !it.selected)
    }));
  };

  const removeProductsById = (ids = []) => {
    if (!ids.length) return;
    updateCart(prev => ({
      ...prev,
      items: prev.items.filter(it => !ids.includes(it.product._id))
    }));
  };

  const updateCartItem = (productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    updateCart(prev => ({
      ...prev,
      items: prev.items.map(it =>
        it.product._id === productId ? { ...it, quantity } : it
      )
    }));
  };

  const removeFromCart = (productId) => {
    updateCart(prev => ({
      ...prev,
      items: prev.items.filter(it => it.product._id !== productId)
    }));
  };

  const clearCart = () => updateCart(() => ({ items: [] }));

  const value = {
    user,
    cart,
    loading,
    login,
    register,
    logout,
    updateProfile,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    getSelectedItems,
    removeSelectedItems,
    removeProductsById,
    addAddress,
    updateAddress,
    deleteAddress,
    addPhone,
    updatePhone,
    deletePhone,
    setDefaultAddress,
    setDefaultPhone,
    fetchUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// ...existing code...