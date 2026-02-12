import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // State structure: { [companyId]: [items] }
    const [carts, setCarts] = useState({});

    const getCart = (companyId) => carts[companyId] || [];

    const addToCart = (product, quantity = 1) => {
        const companyId = product.companyId;
        if (!companyId) {
            console.error("Product has no companyId", product);
            return;
        }

        setCarts((prevCarts) => {
            const currentCart = prevCarts[companyId] || [];
            const existingItem = currentCart.find((item) => item.id === product.id);

            let newCart;
            if (existingItem) {
                newCart = currentCart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newCart = [...currentCart, { ...product, quantity }];
            }

            return { ...prevCarts, [companyId]: newCart };
        });
    };

    const removeFromCart = (companyId, productId) => {
        setCarts((prevCarts) => {
            const currentCart = prevCarts[companyId] || [];
            return {
                ...prevCarts,
                [companyId]: currentCart.filter((item) => item.id !== productId)
            };
        });
    };

    const updateQuantity = (companyId, productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(companyId, productId);
            return;
        }
        setCarts((prevCarts) => {
            const currentCart = prevCarts[companyId] || [];
            return {
                ...prevCarts,
                [companyId]: currentCart.map((item) =>
                    item.id === productId ? { ...item, quantity } : item
                )
            };
        });
    };

    const clearCart = (companyId) => {
        setCarts((prevCarts) => {
            const newCarts = { ...prevCarts };
            delete newCarts[companyId];
            return newCarts;
        });
    };

    const getCartTotal = (companyId) => {
        const cart = getCart(companyId);
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return { totalItems, totalPrice };
    };

    return (
        <CartContext.Provider
            value={{
                carts,
                getCart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getCartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
