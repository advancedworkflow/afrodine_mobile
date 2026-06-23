import React, {createContext, useState, useContext, useCallback, ReactNode} from 'react';

export interface CartExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  /** Plat (0 si c'est un menu) */
  dishId: number;
  restaurantId?: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  extras?: CartExtra[];
  /** Frais de livraison du restaurant (€) */
  deliveryFee?: number;
  /** Si présent, l'article est un menu (dishId = 0, prix = menu) */
  menuId?: number;
  /** IDs des plats du menu (pour expansion au checkout) */
  dishIds?: number[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function generateId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const CartProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {...item, id: generateId()};
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => (i.id === id ? {...i, quantity: Math.max(0, i.quantity + delta)} : i))
        .filter(i => i.quantity > 0),
    );
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const qty = Math.max(0, quantity);
    if (qty === 0) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.map(i => (i.id === id ? {...i, quantity: qty} : i)));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{items, addItem, removeItem, updateQuantity, setQuantity, clearCart}}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
