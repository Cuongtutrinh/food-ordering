// ...existing code...
import React from 'react';

const CartItem = ({ item, onQuantityChange, onRemove, onToggleSelect }) => {
  const { product, quantity, toppings = [], selected } = item;

  const basePrice = product.price * quantity;
  const toppingsPrice = toppings.reduce(
    (sum, t) => sum + (t.price * t.quantity * quantity),
    0
  );
  const totalPrice = basePrice + toppingsPrice;

  const increase = () => onQuantityChange(product._id, quantity + 1);
  const decrease = () => quantity > 1 && onQuantityChange(product._id, quantity - 1);
  const remove = () => onRemove(product._id);

  return (
    <div className={`p-6 flex items-center gap-4 ${selected ? 'bg-orange-50' : ''}`}>
      <input
        type="checkbox"
        className="w-5 h-5 accent-orange-600"
        checked={selected}
        onChange={() => onToggleSelect(product._id, toppings)}
      />
      <img
        src={product.image}
        alt={product.name}
        className="w-20 h-20 object-cover rounded-lg"
      />

      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="text-gray-600 text-sm mt-1">{product.description}</p>

        {toppings.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 mb-1">Toppings:</p>
            <div className="flex flex-wrap gap-1">
              {toppings.map((t, i) => (
                <span
                  key={i}
                  className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full"
                >
                  {t.name} x{t.quantity} (+{(t.price * t.quantity).toLocaleString('vi-VN')}₫)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={decrease}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-1 border-x font-semibold min-w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={increase}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <button
              onClick={remove}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Xóa
            </button>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold text-orange-600">
          {totalPrice.toLocaleString('vi-VN')}₫
        </div>
        <div className="text-sm text-gray-500">
          {product.price.toLocaleString('vi-VN')}₫ × {quantity}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
// ...existing code...