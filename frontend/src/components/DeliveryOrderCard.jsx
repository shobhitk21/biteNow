import React from "react";
import { MdPhone } from "react-icons/md";

const DeliveryOrderCard = ({ data }) => {

    // MAIN STRUCTURE
    const order = data?.order;
    const address = order?.deliveryAddress;
    const shopOrder = order?.shopOrders?.[0];   // Delivered items inside here
    const shop = data?.shop;

    return (
        <div className="bg-white rounded-lg shadow p-4 space-y-4 mb-6">

            {/* Customer Info */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800">
                    {address?.text}
                </h2>

                <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    Payment:{" "}
                    {order?.paymentMethod === "online" ? (
                        <span className="text-green-400">Paid</span>
                    ) : (
                        <span className="text-gray-800">COD</span>
                    )}
                </p>
            </div>

            {/* Address */}
            <div className="flex items-start flex-col text-gray-600 text-sm">
                <p>{address?.text}</p>
                <p>
                    Lat: {address?.latitude}, Lon: {address?.longitude}
                </p>
            </div>

            {/* Shop Info */}
            <div className="flex items-center gap-3">
                <img
                    src={shop?.image}
                    className="w-12 h-12 rounded-full object-cover border"
                />
                <div>
                    <p className="font-semibold text-gray-800">{shop?.name}</p>
                    <p className="text-xs text-gray-500">{shop?.city}</p>
                </div>
            </div>

            {/* Items List */}
            <div className="flex space-x-4 overflow-x-auto pb-2">

                {shopOrder?.shopOrderItems?.map((item, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
                    >
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-gray-500">
                            Qty {item.quantity} × ₹{item.price}
                        </p>
                    </div>
                ))}

            </div>

            {/* Status */}
            <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                <span className="text-sm">
                    Status:{" "}
                    <span className="font-semibold capitalize text-green-600">
                        Delivered
                    </span>
                </span>

                <span className="text-xs text-gray-600">
                    Delivered At: {new Date(shopOrder?.deliveredAt).toLocaleString()}
                </span>
            </div>

            {/* Total */}
            <div className="text-right font-bold text-gray-800 text-sm">
                Total: ₹{shopOrder?.subtotal}
            </div>
        </div>
    );
};

export default DeliveryOrderCard;
