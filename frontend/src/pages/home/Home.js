import React, { useState, useEffect } from 'react';
import { publicAPI } from '../../utils/api';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../../components/products/ProductGrid';
import ProductModal from '../../components/products/ProductModal';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState(''); // State mới để sắp xếp
  const [loading, setLoading] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    fetchProducts();
  }, []);

  // Effect để xử lý tìm kiếm khi URL thay đổi
  // Effect chính để lọc và sắp xếp sản phẩm
  useEffect(() => {
    const query = searchParams.get('search');
    setSearchTerm(query || '');

    let tempProducts = [...products];

    if (query) {
      // Nếu có query, thực hiện tìm kiếm
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setIsSearching(true);
    } else {
      // Nếu không có query, áp dụng bộ lọc danh mục và sắp xếp
      setIsSearching(false);

      // Lọc theo danh mục
      if (selectedCategory !== 'all') {
        tempProducts = tempProducts.filter(product => product.category === selectedCategory);
      }

      // Sắp xếp sản phẩm
      if (sortOrder === 'price-asc') {
        tempProducts.sort((a, b) => a.price - b.price);
      } else if (sortOrder === 'price-desc') {
        tempProducts.sort((a, b) => b.price - a.price);
      }
    }

    setFilteredProducts(tempProducts);

  }, [searchParams, products, selectedCategory, sortOrder]);
  // Filter sản phẩm khi search term thay đổi
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchSuggestions(filtered.slice(0, 5)); // Hiển thị tối đa 5 gợi ý
    setShowSuggestions(true);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await publicAPI.get('/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleSuggestionClick = (product) => {
    setSearchParams({ search: product.name });
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      setSearchParams({ search: trimmedSearchTerm });
    } else {
      setSearchParams({});
    }
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchParams({});
    setSelectedCategory('all');
    setSortOrder(''); // Reset sắp xếp khi xóa tìm kiếm
  };

  const categories = [
    { id: 'all', name: 'Tất cả', emoji: '🍽️' },
    { id: 'food', name: 'Món ăn', emoji: '🍛' },
    { id: 'drink', name: 'Đồ uống', emoji: '🥤' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Đồ ăn ngon, 
            <span className="text-orange-600"> giao tận nơi</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Khám phá thực đơn đa dạng với các món ăn và đồ uống hấp dẫn. 
            Giao hàng nhanh chóng trong 30 phút.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex gap-2">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Tìm kiếm món ăn, đồ uống..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                  />
                  
                  {/* Search Suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                      {searchSuggestions.map(product => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => handleSuggestionClick(product)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                        >
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.price.toLocaleString('vi-VN')}₫
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold"
                >
                  🔍 Tìm kiếm
                </button>
                
                {isSearching && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-200 font-semibold"
                  >
                    ↩️ Quay lại
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Search Results Info */}
        {isSearching && (
          <div className="mb-6 text-center">
            <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
              <p className="text-lg text-gray-700">
                {filteredProducts.length > 0 ? (
                  <>
                    Tìm thấy <span className="font-semibold text-orange-600">{filteredProducts.length}</span> kết quả cho "
                    <span className="font-semibold">{searchTerm}</span>"
                  </>
                ) : (
                  <>
                    <span className="text-red-600 font-semibold">
                      Hiện tại không có món ăn/đồ uống "{searchTerm}". Xin lỗi quý khách!
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Category Filter - Ẩn khi đang tìm kiếm */}
        {!isSearching && (
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
            {/* Category Filter */}
            <div className="bg-white rounded-lg shadow-sm p-2 flex space-x-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      if (category.id === 'all') {
                        setSortOrder(''); // Reset sắp xếp khi chọn "Tất cả"
                      }
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition duration-200 flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
            </div>
            {/* Sort Filter */}
            <div className="bg-white rounded-lg shadow-sm p-2 flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Sắp xếp:</span>
              <button
                onClick={() => setSortOrder('price-asc')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition duration-200 ${
                  sortOrder === 'price-asc' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                }`}
              >
                Giá tăng dần 📈
              </button>
              <button
                onClick={() => setSortOrder('price-desc')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition duration-200 ${
                  sortOrder === 'price-desc' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                }`}
              >
                Giá giảm dần 📉
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <ProductGrid 
          products={filteredProducts} 
          onProductClick={handleProductClick}
        />

        {/* No Results Message */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {isSearching ? 'Không tìm thấy kết quả phù hợp' : 'Không có sản phẩm nào'}
            </h3>
            <p className="text-gray-500 mb-6">
              {isSearching 
                ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xem tất cả sản phẩm'
                : 'Hãy quay lại sau khi chúng tôi cập nhật menu.'
              }
            </p>
            {isSearching && (
              <button
                onClick={clearSearch}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold"
              >
                Xem tất cả sản phẩm
              </button>
            )}
          </div>
        )}

        {/* Product Modal */}
        {isModalOpen && selectedProduct && (
          <ProductModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Home;