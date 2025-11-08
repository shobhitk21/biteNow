import DeliveryAssignment from "../models/deliveryAssignmentModel.js"
import Order from "../models/orderModel.js"
import Shop from "../models/shopModel.js"
import User from "../models/userModel.js"
import { sendDeliveryOtpMail } from "../utils/mail.js"
import Razorpay from "razorpay"
import dotenv from 'dotenv'
import mongoose from "mongoose"
dotenv.config()

let instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body
        if (cartItems.length == 0 || !cartItems) {
            return res.status(400).json({ message: "Cart is empty" })
        }
        if (!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
            return res.status(400).json({ message: "Incomplete delivery address" })
        }

        const groupItemsByShop = {}

        cartItems.forEach(item => {
            const shopId = item.shop._id
            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = []
            }
            groupItemsByShop[shopId].push(item)
        });

        const shopOrders = await Promise.all(Object.keys(groupItemsByShop).map(async (shopId) => {
            const shop = await Shop.findById(shopId).populate("owner")
            if (!shop) {
                return res.status(400).json({ message: "No shop found" })
            }

            const items = groupItemsByShop[shopId]

            const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)

            return {
                shop: shop._id,
                owner: shop.owner._id,
                subtotal,
                shopOrderItems: items.map((i) => ({
                    item: i.id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name
                }))
            }
        })
        )

        if (paymentMethod === "online") {
            const razorOrder = await instance.orders.create({
                amount: Number(totalAmount) * 100,
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            })

            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false
            })

            return res.status(200).json({
                razorOrder,
                orderId: newOrder._id
            })
        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders
        })

        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
        await newOrder.populate("shopOrders.shop", "name")

        return res.status(201).json(newOrder)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpayPaymentId } = req.body

        const payment = await instance.payments.fetch(razorpayPaymentId)
        if (!payment || payment.status !== "captured") {
            return res.status(400).json({ message: "Payment not captured" })
        }

        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "Order not found" })
        }

        order.payment = true
        order.razorpayPaymentId = razorpayPaymentId
        order.save()

        await order.populate("shopOrders.shopOrderItems.item", "name image price")
        await order.populate("shopOrders.shop", "name")

        return res.status(200).json(order)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)

        if (user.role == "user") {
            const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price")
            return res.status(200).json(orders)
        } else if (user.role == "owner") {
            const orders = await Order.find(
                {
                    "shopOrders.owner": req.userId, $or: [
                        { paymentMethod: "cod" },
                        { payment: true }
                    ]
                })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignedDeliveryBoy", "fullName mobile")


            const filteredOrder = orders.map(order => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                shopOrders: order.shopOrders.find(o => o.owner._id == req.userId),
                createdAt: order.createdAt,
                deliveryAddress: order.deliveryAddress
            }))

            return res.status(200).json(filteredOrder)
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const shopOrder = order.shopOrders.id(shopOrderId);
        if (!shopOrder) {
            return res.status(400).json({ message: "Shop order not found" });
        }

        shopOrder.status = status;

        let deliveryBoyPayload = []
        if (status === "Out for delivery" && !shopOrder.assignment) {
            const { longitude, latitude } = order.deliveryAddress;
            const nearByDeliveryBoy = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [Number(longitude), Number(latitude)],
                        },
                        $maxDistance: 20000 // 20 km
                    }
                }
            })
            const nearaByIds = nearByDeliveryBoy?.map(b => b._id)
            const busyIds = await DeliveryAssignment.find({
                assignedTo: { $in: nearaByIds },
                status: { $nin: ["Broadcasted", "Completed"] }
            }).distinct("assignedTo")

            const busyIdSet = new Set(busyIds.map(id => String(id)))
            const availableBoys = nearByDeliveryBoy?.filter(b => !busyIdSet.has(String(b._id)))
            const candidates = availableBoys.map(b => b._id)


            if (candidates.length === 0) {
                await order.save()
                return res.json({ message: "Order updated, no delivery boy available" })
            }
            await order.save()

            const deliveryAssignment = await DeliveryAssignment.create({
                order: order._id,
                shop: shopOrder.shop,
                shopOrderId: shopOrder._id,
                broadcastedTo: candidates,
                status: "Broadcasted",
            })

            const assignments = await DeliveryAssignment.find().populate("order").populate("shop").populate("assignedTo");


            shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo
            shopOrder.assignment = deliveryAssignment._id

            deliveryBoyPayload = availableBoys.map(b => ({
                id: b._id,
                fullName: b.fullName,
                longitude: b.location.coordinates?.[0],
                latitude: b.location.coordinates?.[1],
                mobile: b.mobile
            }))
        }

        await order.save()

        const updatedShopOrder = order.shopOrders.find(o => o.shop.toString() === shopOrderId)


        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile")

        return res.status(200).json({
            shopOrder: updatedShopOrder,
            assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
            availableBoys: deliveryBoyPayload,
            assignment: updatedShopOrder?.assignment?._id || null
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const assignments = await DeliveryAssignment.find({
            broadcastedTo: deliveryBoyId,
            status: "Broadcasted"
        })
            .populate("order")
            .populate("shopOrderId")
            .populate("shop")
            .populate("assignedTo")

        const formatted = assignments.map(a => ({
            orderId: a.order._id,
            assignmentId: a._id,
            shopName: a.shop.name,
            deliveryAddress: a.order.deliveryAddress,
            items: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId))?.shopOrderItems || [],
            subtotal: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId))?.subtotal || 0,
        }))

        return res.status(200).json(formatted)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const acceptOrder = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignment = await DeliveryAssignment.findById(assignmentId);

        if (!assignment) {
            return res.status(400).json({ message: "Assignment not found" });
        }

        if (assignment.status !== "Broadcasted") {
            return res.status(400).json({ message: "Assignment not available" });
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ["Broadcasted", "Completed"] },
        });

        if (alreadyAssigned) {
            return res.status(400).json({ message: "You already have another assignment" });
        }

        assignment.assignedTo = req.userId;
        assignment.status = "Assigned";
        assignment.acceptedAt = new Date();
        await assignment.save();

        const order = await Order.findById(assignment.order);

        if (!order) {
            return res.status(400).json({ message: "Order not found" });
        }

        const shopOrder = order.shopOrders.id(assignment.shopOrderId);

        if (!shopOrder) {
            return res.status(400).json({ message: "Shop order not found" });
        }

        shopOrder.assignedDeliveryBoy = req.userId;
        await order.save();

        return res.status(200).json({ message: "Order accepted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const getCurrentOrder = async (req, res) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "Assigned",
        })
            .populate("shop", "name")
            .populate("assignedTo", "fullName email mobile location")
            .populate({
                path: "order",
                populate: [{ path: "user", select: "fullName email mobile location" }]

            });

        if (!assignment) {
            return res.status(400).json({ message: "No current Order accepted" });
        }
        if (!assignment.order) {
            return res.status(400).json({ message: "Order not found" });
        }

        const shopOrder = assignment.order.shopOrders.find(so => so._id.equals(assignment.shopOrderId));

        if (!shopOrder) {
            return res.status(400).json({ message: "Shop order not found" });
        }

        let deliveryBoyLocation = { lat: null, lon: null }
        if (assignment.assignedTo.location.coordinates.length >= 2) {
            deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates?.[1] || null
            deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates?.[0] || null
        }

        let customerLocation = { lat: null, lon: null }
        if (assignment.order.deliveryAddress) {
            customerLocation.lat = assignment.order.deliveryAddress.latitude || null
            customerLocation.lon = assignment.order.deliveryAddress.longitude || null
        }

        return res.status(200).json({
            _id: assignment._id,
            user: assignment.order.user,
            order: assignment.order,
            shopOrder,
            deliveryAddress: assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation

        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({
                path: "shopOrders.shop",
                model: "Shop",
            })
            .populate({
                path: "shopOrders.assignedDeliveryBoy",
                model: "User",
            })
            .populate({
                path: "shopOrders.shopOrderItems.item",
                model: "Item",
            })
            .lean()

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        return res.status(200).json(order);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body;

        const order = await Order.findById(orderId).populate("user");
        if (!order) return res.status(404).json({ message: "Order not found" });

        const shopOrder = order.shopOrders.find(
            so => so._id.toString() === shopOrderId
        );

        if (!shopOrder) {
            return res.status(404).json({ message: "Shop order not found" });
        }

        const assignment = await DeliveryAssignment.findOne({
            order: orderId,
            shopOrderId: shopOrderId,
            status: "Assigned"
        });

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        shopOrder.deliveryOtp = otp;
        shopOrder.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 mins

        await order.save();
        sendDeliveryOtpMail(order?.user, otp)

        return res.json({
            message: "OTP generated successfully",
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(404).json({ message: "Order or Shop Order not found" })
        }
        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid/Expired OTP" })
        }
        shopOrder.status = "Delivered"
        shopOrder.deliveredAt = Date.now()
        await order.save()
        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        })

        return res.status(200).json({ message: "Order Delivered Successfully!!" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}







