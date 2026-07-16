const DeliveryAssignment = require(
    "../models/deliveryAssignmentModel.js"
);

const Order = require("../models/orderModel.js");
const Shop = require("../models/shopModel.js");
const User = require("../models/userModel.js");
const Razorpay = require("razorpay");
const DUMMY_DELIVERY_OTP = "123456";

require("dotenv").config();

const sameId = (firstId, secondId) => {
    if (!firstId || !secondId) {
        return false;
    }

    return String(firstId) === String(secondId);
};

const getRazorpayInstance = () => {
    if (
        !process.env.RAZORPAY_KEY_ID ||
        !process.env.RAZORPAY_KEY_SECRET
    ) {
        throw new Error(
            "Razorpay environment variables are missing"
        );
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

const getLoggedInUser = async (userId) => {
    if (!userId) {
        return null;
    }

    return User.findById(userId);
};

const ensureDeliveryBoy = async (req, res) => {
    const user = await getLoggedInUser(req.userId);

    if (!user) {
        res.status(401).json({
            message: "Authenticated user not found",
        });

        return null;
    }

    if (user.role !== "deliveryBoy") {
        res.status(403).json({
            message: "Only delivery partners can perform this action",
        });

        return null;
    }

    return user;
};

const placeOrder = async (req, res) => {
    try {
        const {
            cartItems,
            paymentMethod,
            deliveryAddress,
            totalAmount,
        } = req.body;

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({
                message: "Cart is empty",
            });
        }

        if (
            !deliveryAddress?.text ||
            deliveryAddress?.latitude === undefined ||
            deliveryAddress?.longitude === undefined
        ) {
            return res.status(400).json({
                message: "Incomplete delivery address",
            });
        }

        if (!["cod", "online"].includes(paymentMethod)) {
            return res.status(400).json({
                message: "Invalid payment method",
            });
        }

        const numericTotal = Number(totalAmount);

        if (
            Number.isNaN(numericTotal) ||
            numericTotal <= 0
        ) {
            return res.status(400).json({
                message: "Invalid order amount",
            });
        }

        const groupedItems = {};

        for (const item of cartItems) {
            const shopId = item?.shop?._id || item?.shop;

            if (!shopId) {
                throw new Error(
                    `Shop information is missing for ${item?.name || "an item"}`
                );
            }

            if (!groupedItems[shopId]) {
                groupedItems[shopId] = [];
            }

            groupedItems[shopId].push(item);
        }

        const shopOrders = [];

        for (const shopId of Object.keys(groupedItems)) {
            const shop = await Shop.findById(shopId).populate(
                "owner"
            );

            if (!shop || !shop.owner) {
                return res.status(404).json({
                    message: "Shop or shop owner not found",
                });
            }

            const items = groupedItems[shopId];

            const subtotal = items.reduce((sum, item) => {
                return (
                    sum +
                    (Number(item?.price) || 0) *
                    (Number(item?.quantity) || 0)
                );
            }, 0);

            shopOrders.push({
                shop: shop._id,
                owner: shop.owner._id,
                subtotal,
                shopOrderItems: items.map((item) => ({
                    item: item?._id || item?.id,
                    price: Number(item?.price) || 0,
                    quantity: Number(item?.quantity) || 1,
                    name: item?.name || "Item",
                })),
            });
        }

        if (paymentMethod === "online") {
            const razorpay = getRazorpayInstance();

            const razorOrder = await razorpay.orders.create({
                amount: Math.round(numericTotal * 100),
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            });

            const order = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount: numericTotal,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false,
            });

            return res.status(200).json({
                razorOrder,
                orderId: order._id,
            });
        }

        const order = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount: numericTotal,
            shopOrders,
        });

        await order.populate([
            {
                path: "user",
                select: "fullName email mobile socketId",
            },
            {
                path: "shopOrders.shopOrderItems.item",
                select: "name image price",
            },
            {
                path: "shopOrders.shop",
                select: "name socketId",
            },
            {
                path: "shopOrders.owner",
                select: "fullName email mobile socketId",
            },
        ]);

        const io = req.app.get("io");

        if (io) {
            order.shopOrders.forEach((shopOrder) => {
                const ownerSocketId = shopOrder.owner?.socketId;

                if (!ownerSocketId) {
                    return;
                }

                io.to(ownerSocketId).emit("newOrder", {
                    _id: order._id,
                    paymentMethod: order.paymentMethod,
                    user: order.user,
                    shopOrders: shopOrder,
                    createdAt: order.createdAt,
                    deliveryAddress: order.deliveryAddress,
                });
            });
        }

        return res.status(201).json(order);
    } catch (error) {
        console.error("Place order error:", error);

        return res.status(500).json({
            message: error.message || "Unable to place order",
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpayPaymentId } = req.body;

        if (!orderId || !razorpayPaymentId) {
            return res.status(400).json({
                message:
                    "Order ID and Razorpay payment ID are required",
            });
        }

        const razorpay = getRazorpayInstance();

        const payment = await razorpay.payments.fetch(
            razorpayPaymentId
        );

        if (!payment || payment.status !== "captured") {
            return res.status(400).json({
                message: "Payment was not captured",
            });
        }

        const order = await Order.findById(orderId).populate([
            {
                path: "user",
                select: "fullName email mobile socketId",
            },
            {
                path: "shopOrders.shopOrderItems.item",
                select: "name image price",
            },
            {
                path: "shopOrders.shop",
                select: "name",
            },
            {
                path: "shopOrders.owner",
                select: "fullName email mobile socketId",
            },
        ]);

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        order.payment = true;
        order.razorpayPaymentId = razorpayPaymentId;

        await order.save();

        const io = req.app.get("io");

        if (io) {
            for (const shopOrder of order.shopOrders) {
                const ownerSocketId = shopOrder.owner?.socketId;

                if (ownerSocketId) {
                    io.to(ownerSocketId).emit("newOrder", {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                    });
                }
            }
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error("Verify payment error:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to verify payment",
        });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const user = await getLoggedInUser(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.role === "user") {
            const orders = await Order.find({
                user: req.userId,
            })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate(
                    "shopOrders.owner",
                    "fullName email mobile"
                )
                .populate(
                    "shopOrders.shopOrderItems.item",
                    "name image price"
                );

            return res.status(200).json(orders);
        }

        if (user.role === "owner") {
            const orders = await Order.find({
                "shopOrders.owner": req.userId,
                $or: [
                    { paymentMethod: "cod" },
                    { payment: true },
                ],
            })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")
                .populate(
                    "shopOrders.shopOrderItems.item",
                    "name image price"
                )
                .populate(
                    "shopOrders.assignedDeliveryBoy",
                    "fullName mobile"
                );

            const filteredOrders = orders
                .map((order) => {
                    const selectedShopOrder =
                        order.shopOrders.find((shopOrder) =>
                            sameId(shopOrder.owner, req.userId)
                        );

                    if (!selectedShopOrder) {
                        return null;
                    }

                    return {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: selectedShopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                    };
                })
                .filter(Boolean);

            return res.status(200).json(filteredOrders);
        }

        return res.status(200).json([]);
    } catch (error) {
        console.error("Get my orders error:", error);

        return res.status(500).json({
            message: error.message || "Unable to get orders",
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Preparing",
            "Out for delivery",
            "Delivered",
            "Cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        const shopOrder = order.shopOrders.id(shopOrderId);

        if (!shopOrder) {
            return res.status(404).json({
                message: "Shop order not found",
            });
        }

        if (!sameId(shopOrder.owner, req.userId)) {
            return res.status(403).json({
                message:
                    "You cannot update another shop owner's order",
            });
        }

        shopOrder.status = status;

        let availableDeliveryBoyData = [];
        let createdAssignment = null;

        if (
            status === "Out for delivery" &&
            !shopOrder.assignment
        ) {
            const longitude = Number(
                order.deliveryAddress?.longitude
            );

            const latitude = Number(
                order.deliveryAddress?.latitude
            );

            if (
                Number.isNaN(longitude) ||
                Number.isNaN(latitude)
            ) {
                return res.status(400).json({
                    message: "Delivery coordinates are missing",
                });
            }

            const nearbyDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude],
                        },
                        $maxDistance: 5000000,
                    },
                },
            });

            const nearbyIds = nearbyDeliveryBoys.map(
                (deliveryBoy) => deliveryBoy._id
            );

            const busyIds = await DeliveryAssignment.find({
                assignedTo: {
                    $in: nearbyIds,
                },
                status: "Assigned",
            }).distinct("assignedTo");

            const busyIdSet = new Set(
                busyIds.map((id) => String(id))
            );

            const availableDeliveryBoys =
                nearbyDeliveryBoys.filter(
                    (deliveryBoy) =>
                        !busyIdSet.has(String(deliveryBoy._id))
                );

            const candidateIds = availableDeliveryBoys.map(
                (deliveryBoy) => deliveryBoy._id
            );

            await order.save();

            if (candidateIds.length === 0) {
                return res.status(200).json({
                    message:
                        "Order updated, but no delivery partner is currently available",
                    shopOrder,
                    availableBoys: [],
                    assignment: null,
                });
            }

            const deliveryAssignment =
                await DeliveryAssignment.create({
                    order: order._id,
                    shop: shopOrder.shop,
                    shopOrderId: shopOrder._id,
                    broadcastedTo: candidateIds,
                    status: "Broadcasted",
                });

            shopOrder.assignment = deliveryAssignment._id;

            await order.save();

            createdAssignment = deliveryAssignment._id;

            availableDeliveryBoyData =
                availableDeliveryBoys.map((deliveryBoy) => ({
                    id: deliveryBoy._id,
                    fullName: deliveryBoy.fullName,
                    longitude:
                        deliveryBoy.location?.coordinates?.[0] ?? null,
                    latitude:
                        deliveryBoy.location?.coordinates?.[1] ?? null,
                    mobile: deliveryBoy.mobile,
                }));

            await deliveryAssignment.populate("shop");
            await deliveryAssignment.populate("order");

            const io = req.app.get("io");

            if (io) {
                availableDeliveryBoys.forEach((deliveryBoy) => {
                    if (!deliveryBoy.socketId) {
                        return;
                    }

                    const selectedOrder =
                        deliveryAssignment.order.shopOrders.find(
                            (currentShopOrder) =>
                                sameId(
                                    currentShopOrder._id,
                                    deliveryAssignment.shopOrderId
                                )
                        );

                    io.to(deliveryBoy.socketId).emit(
                        "newAssignment",
                        {
                            sentTo: deliveryBoy._id,
                            orderId: deliveryAssignment.order._id,
                            assignmentId: deliveryAssignment._id,
                            shopName:
                                deliveryAssignment.shop?.name || "Shop",
                            deliveryAddress:
                                deliveryAssignment.order.deliveryAddress,
                            items:
                                selectedOrder?.shopOrderItems || [],
                            subtotal: selectedOrder?.subtotal || 0,
                        }
                    );
                });
            }
        }

        await order.save();

        await order.populate(
            "shopOrders.shop",
            "name"
        );

        await order.populate(
            "shopOrders.owner",
            "socketId"
        );

        await order.populate(
            "shopOrders.assignedDeliveryBoy",
            "fullName email mobile"
        );

        await order.populate("user", "socketId");

        const updatedShopOrder =
            order.shopOrders.id(shopOrderId);

        const io = req.app.get("io");

        if (io && updatedShopOrder) {
            const payload = {
                orderId: order._id,
                shopId: updatedShopOrder.shop?._id,
                status: updatedShopOrder.status,
                userId: order.user?._id,
            };

            if (order.user?.socketId) {
                io.to(order.user.socketId).emit(
                    "update-status",
                    payload
                );
            }

            if (updatedShopOrder.owner?.socketId) {
                io.to(updatedShopOrder.owner.socketId).emit(
                    "update-status",
                    payload
                );
            }
        }

        return res.status(200).json({
            shopOrder: updatedShopOrder,
            assignedDeliveryBoy:
                updatedShopOrder?.assignedDeliveryBoy || null,
            availableBoys: availableDeliveryBoyData,
            assignment:
                createdAssignment ||
                updatedShopOrder?.assignment ||
                null,
        });
    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to update order status",
        });
    }
};

const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const deliveryBoy = await ensureDeliveryBoy(req, res);

        if (!deliveryBoy) {
            return;
        }

        const assignments = await DeliveryAssignment.find({
            broadcastedTo: req.userId,
            status: "Broadcasted",
        })
            .populate("order")
            .populate("shop")
            .populate("assignedTo");

        const formattedAssignments = assignments
            .map((assignment) => {
                if (!assignment.order) {
                    return null;
                }

                const selectedShopOrder =
                    assignment.order.shopOrders.find(
                        (shopOrder) =>
                            sameId(
                                shopOrder._id,
                                assignment.shopOrderId
                            )
                    );

                return {
                    orderId: assignment.order._id,
                    assignmentId: assignment._id,
                    shopName: assignment.shop?.name || "Shop",
                    deliveryAddress:
                        assignment.order.deliveryAddress,
                    items: selectedShopOrder?.shopOrderItems || [],
                    subtotal: selectedShopOrder?.subtotal || 0,
                };
            })
            .filter(Boolean);

        return res.status(200).json(
            formattedAssignments
        );
    } catch (error) {
        console.error(
            "Get delivery assignments error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to get delivery assignments",
        });
    }
};

const acceptOrder = async (req, res) => {
    try {
        const deliveryBoy = await ensureDeliveryBoy(req, res);

        if (!deliveryBoy) {
            return;
        }

        const { assignmentId } = req.params;

        const existingAssignment =
            await DeliveryAssignment.findOne({
                assignedTo: req.userId,
                status: "Assigned",
            });

        if (existingAssignment) {
            return res.status(400).json({
                message:
                    "You already have another active assignment",
            });
        }

        const assignment =
            await DeliveryAssignment.findOneAndUpdate(
                {
                    _id: assignmentId,
                    status: "Broadcasted",
                    broadcastedTo: req.userId,
                },
                {
                    assignedTo: req.userId,
                    status: "Assigned",
                    acceptedAt: new Date(),
                },
                {
                    new: true,
                }
            );

        if (!assignment) {
            return res.status(409).json({
                message:
                    "This assignment is no longer available",
            });
        }

        const order = await Order.findById(
            assignment.order
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        const shopOrder = order.shopOrders.id(
            assignment.shopOrderId
        );

        if (!shopOrder) {
            return res.status(404).json({
                message: "Shop order not found",
            });
        }

        shopOrder.assignedDeliveryBoy = req.userId;
        shopOrder.assignment = assignment._id;

        await order.save();

        return res.status(200).json({
            message: "Order accepted successfully",
        });
    } catch (error) {
        console.error("Accept order error:", error);

        return res.status(500).json({
            message: error.message || "Unable to accept order",
        });
    }
};

const getCurrentOrder = async (req, res) => {
    try {
        const deliveryBoy = await ensureDeliveryBoy(req, res);

        if (!deliveryBoy) {
            return;
        }

        const assignment =
            await DeliveryAssignment.findOne({
                assignedTo: req.userId,
                status: "Assigned",
            })
                .populate("shop", "name")
                .populate(
                    "assignedTo",
                    "fullName email mobile location"
                )
                .populate({
                    path: "order",
                    populate: [
                        {
                            path: "user",
                            select:
                                "fullName email mobile location socketId",
                        },
                    ],
                });

        if (!assignment) {
            return res.status(200).json(null);
        }

        if (!assignment.order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        const shopOrder =
            assignment.order.shopOrders.find(
                (currentShopOrder) =>
                    sameId(
                        currentShopOrder._id,
                        assignment.shopOrderId
                    )
            );

        if (!shopOrder) {
            return res.status(404).json({
                message: "Shop order not found",
            });
        }

        const assignedCoordinates =
            assignment.assignedTo?.location?.coordinates;

        const deliveryBoyLocation = {
            lat:
                Array.isArray(assignedCoordinates) &&
                    assignedCoordinates.length >= 2
                    ? assignedCoordinates[1]
                    : null,

            lon:
                Array.isArray(assignedCoordinates) &&
                    assignedCoordinates.length >= 2
                    ? assignedCoordinates[0]
                    : null,
        };

        const customerLocation = {
            lat:
                assignment.order.deliveryAddress?.latitude ??
                null,

            lon:
                assignment.order.deliveryAddress?.longitude ??
                null,
        };

        return res.status(200).json({
            _id: assignment._id,
            shopName: assignment.shop?.name || "Shop",
            user: assignment.order.user,
            order: assignment.order,
            shopOrder,
            deliveryAddress:
                assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation,
        });
    } catch (error) {
        console.error("Get current order error:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to get current order",
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate("user")
            .populate("shopOrders.shop")
            .populate("shopOrders.assignedDeliveryBoy")
            .populate("shopOrders.shopOrderItems.item")
            .lean();

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error("Get order by ID error:", error);

        return res.status(500).json({
            message: error.message || "Unable to get order",
        });
    }
};

const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body;

        if (!orderId || !shopOrderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID and shop order ID are required",
            });
        }

        const assignment = await DeliveryAssignment.findOne({
            order: orderId,
            shopOrderId,
            assignedTo: req.userId,
            status: "Assigned",
        });

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: "This order is not assigned to you",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const shopOrder = order.shopOrders.id(shopOrderId);

        if (!shopOrder) {
            return res.status(404).json({
                success: false,
                message: "Shop order not found",
            });
        }

        if (shopOrder.status === "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Order has already been delivered",
            });
        }

        /*
         * This is a fixed OTP for demonstration only.
         */
        shopOrder.deliveryOtp = Number(DUMMY_DELIVERY_OTP);

        shopOrder.otpExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Dummy delivery OTP generated successfully",
            dummyOtp: DUMMY_DELIVERY_OTP,
            expiresInMinutes: 10,
        });
    } catch (error) {
        console.error("Generate dummy OTP error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to generate dummy delivery OTP",
        });
    }
};

const verifyDeliveryOtp = async (req, res) => {
    try {
        const {
            orderId,
            shopOrderId,
            otp,
        } = req.body;

        if (!orderId || !shopOrderId || !otp) {
            return res.status(400).json({
                success: false,
                message:
                    "Order ID, shop order ID and OTP are required",
            });
        }

        /*
         * Check that this assignment belongs to the logged-in
         * delivery partner.
         */
        const assignment =
            await DeliveryAssignment.findOne({
                order: orderId,
                shopOrderId,
                assignedTo: req.userId,
                status: "Assigned",
            });

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message:
                    "This order is not assigned to your account",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const shopOrder =
            order.shopOrders.id(shopOrderId);

        if (!shopOrder) {
            return res.status(404).json({
                success: false,
                message: "Shop order not found",
            });
        }

        if (shopOrder.status === "Delivered") {
            return res.status(400).json({
                success: false,
                message:
                    "This order has already been delivered",
            });
        }

        const enteredOtp = String(otp).trim();

        const storedOtp = String(
            shopOrder.deliveryOtp || ""
        );

        const otpExpiryTime =
            shopOrder.otpExpires
                ? new Date(
                    shopOrder.otpExpires
                ).getTime()
                : 0;

        if (!storedOtp || enteredOtp !== storedOtp) {
            return res.status(400).json({
                success: false,
                message: "Incorrect dummy OTP",
            });
        }

        if (
            !otpExpiryTime ||
            otpExpiryTime < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Dummy OTP has expired. Generate it again.",
            });
        }

        const deliveredAt = new Date();

        /*
         * Update the shop order.
         */
        shopOrder.status = "Delivered";
        shopOrder.deliveredAt = deliveredAt;
        shopOrder.deliveryOtp = undefined;
        shopOrder.otpExpires = undefined;

        await order.save();

        /*
         * Update assignment separately and explicitly.
         * This deliveredAt field is used for today's earning.
         */
        const deliveredAssignment =
            await DeliveryAssignment.findByIdAndUpdate(
                assignment._id,
                {
                    $set: {
                        status: "Delivered",
                        deliveredAt,
                        assignedTo: req.userId,
                    },
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!deliveredAssignment) {
            return res.status(500).json({
                success: false,
                message:
                    "Order was updated, but delivery assignment could not be updated",
            });
        }

        /*
         * Notify customer and owner about delivery.
         */
        await order.populate(
            "user",
            "socketId"
        );

        await order.populate(
            "shopOrders.owner",
            "socketId"
        );

        await order.populate(
            "shopOrders.shop",
            "name"
        );

        const updatedShopOrder =
            order.shopOrders.id(shopOrderId);

        const io = req.app.get("io");

        if (io) {
            const statusPayload = {
                orderId: order._id,

                shopId:
                    updatedShopOrder?.shop?._id ||
                    updatedShopOrder?.shop,

                status: "Delivered",

                userId:
                    order.user?._id ||
                    order.user,
            };

            if (order.user?.socketId) {
                io.to(
                    order.user.socketId
                ).emit(
                    "update-status",
                    statusPayload
                );
            }

            if (
                updatedShopOrder?.owner?.socketId
            ) {
                io.to(
                    updatedShopOrder.owner.socketId
                ).emit(
                    "update-status",
                    statusPayload
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Order delivered successfully",
            deliveredAt,
        });
    } catch (error) {
        console.error(
            "Verify dummy delivery OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to verify delivery OTP",
        });
    }
};

const getTodayDeliveries = async (req, res) => {
    try {
        const deliveryBoyId = req.userId;

        if (!deliveryBoyId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const startOfDay = new Date();

        startOfDay.setHours(
            0,
            0,
            0,
            0
        );

        const endOfDay = new Date(
            startOfDay
        );

        endOfDay.setDate(
            endOfDay.getDate() + 1
        );

        const deliveredAssignments =
            await DeliveryAssignment.find({
                assignedTo: deliveryBoyId,
                status: "Delivered",

                deliveredAt: {
                    $gte: startOfDay,
                    $lt: endOfDay,
                },
            })
                .select("deliveredAt")
                .lean();

        const deliveriesByHour = {};

        deliveredAssignments.forEach(
            (assignment) => {
                if (!assignment.deliveredAt) {
                    return;
                }

                const deliveryHour = new Date(
                    assignment.deliveredAt
                ).getHours();

                deliveriesByHour[deliveryHour] =
                    (deliveriesByHour[
                        deliveryHour
                    ] || 0) + 1;
            }
        );

        const formattedDeliveries =
            Object.entries(
                deliveriesByHour
            )
                .map(([hour, count]) => ({
                    hour: Number(hour),
                    count,
                }))
                .sort(
                    (first, second) =>
                        first.hour - second.hour
                );

        return res.status(200).json(
            formattedDeliveries
        );
    } catch (error) {
        console.error(
            "Get today deliveries error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load today's deliveries",
        });
    }
};

const getDeliveredOrdersByDeliveryBoy = async (
    req,
    res
) => {
    try {
        const deliveryBoy = await ensureDeliveryBoy(req, res);

        if (!deliveryBoy) {
            return;
        }

        const deliveredAssignments =
            await DeliveryAssignment.find({
                assignedTo: req.userId,
                status: "Delivered",
            })
                .sort({ deliveredAt: -1 })
                .populate("order")
                .populate("shop")
                .populate({
                    path: "order",
                    populate: {
                        path: "shopOrders.shop",
                    },
                });

        return res.status(200).json({
            success: true,
            deliveredOrders: deliveredAssignments,
        });
    } catch (error) {
        console.error(
            "Get delivered orders error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to get delivered orders",
        });
    }
};

module.exports = {
    placeOrder,
    verifyPayment,
    getMyOrders,
    updateOrderStatus,
    getDeliveryBoyAssignment,
    acceptOrder,
    getCurrentOrder,
    getOrderById,
    sendDeliveryOtp,
    verifyDeliveryOtp,
    getTodayDeliveries,
    getDeliveredOrdersByDeliveryBoy,
};