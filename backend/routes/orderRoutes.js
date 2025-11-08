const express = require('express');
const { isAuth } = require('../middlewares/isAuth.js');
const { placeOrder, getMyOrders, updateOrderStatus, getDeliveryBoyAssignment, acceptOrder, getCurrentOrder, getOrderById, sendDeliveryOtp, verifyDeliveryOtp, verifyPayment } = require('../controllers/orderController.js');
const orderRouter = express.Router()

orderRouter.post("/place-order", isAuth, placeOrder);
orderRouter.get("/my-orders", isAuth, getMyOrders);
orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment);
orderRouter.get("/get-current-order", isAuth, getCurrentOrder);
orderRouter.post("/send-delivery-otp", isAuth, sendDeliveryOtp);
orderRouter.post("/verify-delivery-otp", isAuth, verifyDeliveryOtp);
orderRouter.post("/verify-payment", isAuth, verifyPayment);
orderRouter.post("/update-status/:orderId/:shopOrderId", isAuth, updateOrderStatus);
orderRouter.post("/accept-order/:assignmentId", isAuth, acceptOrder);
orderRouter.get("/get-order-by-id/:orderId", isAuth, getOrderById);



module.exports = orderRouter