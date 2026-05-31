/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext();

const getProductStock = (product) => Number(product?.stockLevel ?? product?.stock ?? 0);
const getProductPrice = (product) => Number(product?.srp ?? product?.price ?? 0);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});

  // Clear cart when user changes/logs out
  useEffect(() => {
    if (!user) {
      setCart([]);
      setQuantities({});
    }
  }, [user]);

  const addToCart = (product, quantity = 1) => {
    const stock = getProductStock(product);
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    if (stock <= 0) {
      return false;
    }

    const existingCartItem = cart.find((item) => item._id === product._id);

    if (existingCartItem && existingCartItem.quantity >= stock) {
      return false;
    }

    const price = getProductPrice(product);
    const cartItem = {
      ...product,
      name: product.productName || product.name,
      price,
      stockLevel: stock,
      quantity: Math.min(safeQuantity, stock),
      subtotal: price * Math.min(safeQuantity, stock)
    };
    
    setCart(prev => {
      const existingItem = prev.find(item => item._id === product._id);
      if (existingItem) {
        const nextQuantity = Math.min(existingItem.quantity + safeQuantity, stock);

        return prev.map(item => 
          item._id === product._id 
            ? { ...item, stockLevel: stock, quantity: nextQuantity, subtotal: nextQuantity * price }
            : item
        );
      }

      return [...prev, cartItem];
    });
    
    setQuantities(prev => ({ ...prev, [product._id]: 1 }));
    return true;
  };

  const updateQuantity = (productId, change) => {
    const cartItem = cart.find((item) => item._id === productId);
    const maxStock = Math.max(1, getProductStock(cartItem));

    setQuantities(prev => ({
      ...prev,
      [productId]: Math.min(maxStock, Math.max(1, (prev[productId] || 1) + change))
    }));

    setCart(prev => prev.map((item) => {
      if (item._id !== productId) return item;
      const nextQuantity = Math.min(Math.max(1, getProductStock(item)), Math.max(1, item.quantity + change));
      return {
        ...item,
        quantity: nextQuantity,
        subtotal: nextQuantity * item.price,
      };
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[productId];
      return newQuantities;
    });
  };

  const clearCart = () => {
    setCart([]);
    setQuantities({});
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      quantities,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getTotalItems,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
