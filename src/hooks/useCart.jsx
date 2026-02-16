import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

// Helper: get the effective price for an item based on quantity and wholesale tiers
function getEffectivePrice(item) {
    const { quantity, wholesale_prices, price } = item;
    if (wholesale_prices && wholesale_prices.length > 0) {
        // Sort tiers descending by min_qty to find the best matching tier
        const sorted = [...wholesale_prices].sort((a, b) => b.min_qty - a.min_qty);
        const matchingTier = sorted.find(tier => quantity >= tier.min_qty);
        if (matchingTier) {
            return { unitPrice: matchingTier.price, isWholesale: true, tierMinQty: matchingTier.min_qty };
        }
    }
    return { unitPrice: price, isWholesale: false, tierMinQty: null };
}

export const CartProvider = ({ children }) => {
    // State structure: { [companyId]: [items] }
    const [carts, setCarts] = useState({});
    // Company info: { [companyId]: { name, slug, whatsapp, logo } }
    const [companyInfo, setCompanyInfoState] = useState({});

    const getCart = (companyId) => carts[companyId] || [];

    const setCompanyInfo = (companyId, info) => {
        setCompanyInfoState(prev => ({
            ...prev,
            [companyId]: { ...prev[companyId], ...info }
        }));
    };

    const addToCart = (product, quantity = 1) => {
        const companyId = product.companyId || product.company_id;
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
        const totalPrice = cart.reduce((sum, item) => {
            const { unitPrice } = getEffectivePrice(item);
            return sum + unitPrice * item.quantity;
        }, 0);
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
                companyInfo,
                setCompanyInfo,
                getEffectivePrice,
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
