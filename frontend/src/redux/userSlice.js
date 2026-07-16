import { createSlice } from "@reduxjs/toolkit";

const loadSavedCart = () => {
    try {
        const savedCart = localStorage.getItem("cartItems");

        if (!savedCart) {
            return [];
        }

        const parsedCart = JSON.parse(savedCart);

        return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
        console.error("Failed to load cart:", error);
        return [];
    }
};

const saveCart = (cartItems) => {
    try {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (error) {
        console.error("Failed to save cart:", error);
    }
};

const calculateTotal = (cartItems) => {
    if (!Array.isArray(cartItems)) {
        return 0;
    }

    return cartItems.reduce((total, item) => {
        const price = Number(item?.price) || 0;
        const quantity = Number(item?.quantity) || 0;

        return total + price * quantity;
    }, 0);
};

const getItemId = (item) => {
    return item?._id || item?.id;
};

const savedCart = loadSavedCart();

const initialState = {
    userData: null,

    currentCity: null,
    currentState: null,
    currentAddress: null,

    // Old city-based data kept so existing files do not break
    shopsInMyCity: [],
    itemsInMyCity: [],

    // New location-independent data
    allShops: [],
    allItems: [],

    cartItems: savedCart,
    totalAmount: calculateTotal(savedCart),

    myOrders: [],
    searchItems: [],
    socket: null,
};

const userSlice = createSlice({
    name: "user",

    initialState,

    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload || null;
        },

        clearUserData: (state) => {
            state.userData = null;

            state.currentCity = null;
            state.currentState = null;
            state.currentAddress = null;

            state.shopsInMyCity = [];
            state.itemsInMyCity = [];

            state.allShops = [];
            state.allItems = [];

            state.myOrders = [];
            state.searchItems = [];
            state.socket = null;
        },

        setCurrentCity: (state, action) => {
            state.currentCity = action.payload || null;
        },

        setCurrentState: (state, action) => {
            state.currentState = action.payload || null;
        },

        setCurrentAddress: (state, action) => {
            state.currentAddress = action.payload || null;
        },

        setShopsInMyCity: (state, action) => {
            state.shopsInMyCity = Array.isArray(action.payload)
                ? action.payload
                : [];
        },

        setItemsInMyCity: (state, action) => {
            state.itemsInMyCity = Array.isArray(action.payload)
                ? action.payload
                : [];
        },

        setAllShops: (state, action) => {
            state.allShops = Array.isArray(action.payload)
                ? action.payload
                : [];
        },

        setAllItems: (state, action) => {
            state.allItems = Array.isArray(action.payload)
                ? action.payload
                : [];
        },

        setSearchItems: (state, action) => {
            state.searchItems = Array.isArray(action.payload)
                ? action.payload
                : [];
        },

        clearSearchItems: (state) => {
            state.searchItems = [];
        },

        addToCart: (state, action) => {
            const cartItem = action.payload;

            if (!cartItem) {
                return;
            }

            const cartItemId = getItemId(cartItem);

            if (!cartItemId) {
                console.error("Cart item does not contain an id");
                return;
            }

            const existingItem = state.cartItems.find(
                (item) => getItemId(item) === cartItemId
            );

            const quantityToAdd = Math.max(
                1,
                Number(cartItem.quantity) || 1
            );

            if (existingItem) {
                existingItem.quantity =
                    (Number(existingItem.quantity) || 0) + quantityToAdd;
            } else {
                state.cartItems.push({
                    ...cartItem,
                    quantity: quantityToAdd,
                });
            }

            state.totalAmount = calculateTotal(state.cartItems);
            saveCart(state.cartItems);
        },

        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload || {};

            const item = state.cartItems.find(
                (cartItem) => getItemId(cartItem) === id
            );

            if (!item) {
                return;
            }

            item.quantity = Math.max(1, Number(quantity) || 1);

            state.totalAmount = calculateTotal(state.cartItems);
            saveCart(state.cartItems);
        },

        removeCartItem: (state, action) => {
            const id = action.payload;

            state.cartItems = state.cartItems.filter(
                (item) => getItemId(item) !== id
            );

            state.totalAmount = calculateTotal(state.cartItems);
            saveCart(state.cartItems);
        },

        clearCart: (state) => {
            state.cartItems = [];
            state.totalAmount = 0;

            saveCart([]);
        },

        setMyOrders: (state, action) => {
            state.myOrders = Array.isArray(action.payload)
                ? action.payload
                : [];
        },

        addMyOrders: (state, action) => {
            if (!action.payload) {
                return;
            }

            if (!Array.isArray(state.myOrders)) {
                state.myOrders = [];
            }

            state.myOrders.unshift(action.payload);
        },

        updateOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload || {};

            const order = state.myOrders.find(
                (currentOrder) => currentOrder?._id === orderId
            );

            if (!order?.shopOrders) {
                return;
            }

            const shopOrders = Array.isArray(order.shopOrders)
                ? order.shopOrders
                : [order.shopOrders];

            const selectedShopOrder = shopOrders.find((shopOrder) => {
                const currentShopId =
                    shopOrder?.shop?._id ||
                    shopOrder?.shop ||
                    shopOrder?._id;

                return currentShopId === shopId;
            });

            if (selectedShopOrder) {
                selectedShopOrder.status = status;
            }
        },

        updateRealtimeOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload || {};

            const order = state.myOrders.find(
                (currentOrder) => currentOrder?._id === orderId
            );

            if (!order?.shopOrders) {
                return;
            }

            const shopOrders = Array.isArray(order.shopOrders)
                ? order.shopOrders
                : [order.shopOrders];

            const selectedShopOrder = shopOrders.find((shopOrder) => {
                const currentShopId =
                    shopOrder?.shop?._id ||
                    shopOrder?.shop ||
                    shopOrder?._id;

                return currentShopId === shopId;
            });

            if (selectedShopOrder) {
                selectedShopOrder.status = status;
            }
        },

        setSocket: (state, action) => {
            state.socket = action.payload || null;
        },
    },
});

export const {
    setUserData,
    clearUserData,

    setCurrentCity,
    setCurrentState,
    setCurrentAddress,

    setShopsInMyCity,
    setItemsInMyCity,

    setAllShops,
    setAllItems,

    setSearchItems,
    clearSearchItems,

    addToCart,
    updateQuantity,
    removeCartItem,
    clearCart,

    setMyOrders,
    addMyOrders,
    updateOrderStatus,
    updateRealtimeOrderStatus,

    setSocket,
} = userSlice.actions;

export default userSlice.reducer;