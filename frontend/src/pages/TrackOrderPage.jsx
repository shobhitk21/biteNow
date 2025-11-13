import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoIosArrowRoundBack } from "react-icons/io";
import DeliveryBoyTracking from '../components/DeliveryBoyTracking';
import { useSelector } from 'react-redux';

const TrackOrderPage = () => {
    const { orderId } = useParams();
    const [currentOrder, setCurrentOrder] = useState(null);
    const [liveLocation, setLiveLocation] = useState({});
    const navigate = useNavigate();
    const { socket } = useSelector(state => state.user);

    const handleGetOrder = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/order/get-order-by-id/${orderId}`,
                { withCredentials: true }
            );
            setCurrentOrder(data);
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to fetch order")
        }
    };

    useEffect(() => {
        if (!socket) {
            return
        }

        const handleLocationUpdate = ({ deliveryBoyId, latitude, longitude }) => {
            if (!deliveryBoyId) return;

            setLiveLocation(prev => ({
                ...(prev || {}),
                [deliveryBoyId]: { lat: latitude, lon: longitude },
            }));
        };

        socket.on("updateDeliveryLocation", handleLocationUpdate);
        return () => socket.off("updateDeliveryLocation", handleLocationUpdate);
    }, [socket]);

    useEffect(() => {
        handleGetOrder();
    }, [orderId]);

    return (
        <div className='max-w-4xl mx-auto p-4 flex flex-col gap-6'>
            <div className='flex items-center gap-[20px] mb-6'>
                <div className='z-[10] cursor-pointer' onClick={() => navigate("/")}>
                    <IoIosArrowRoundBack size={45} className='text-primaryColor' />
                </div>
                <h1 className='text-2xl font-bold text-start'>Track Order</h1>
            </div>

            {!currentOrder ? (
                <p className='text-center text-gray-500'>Loading order details...</p>
            ) : (
                currentOrder?.shopOrders?.map((shopOrder, index) => {
                    const assignedBoy = shopOrder?.assignedDeliveryBoy;
                    const deliveryBoyLocation = liveLocation[assignedBoy?._id] || {
                        lat: assignedBoy?.location?.coordinates?.[1] ?? 0,
                        lon: assignedBoy?.location?.coordinates?.[0] ?? 0,
                    };

                    return (
                        <div
                            className='bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4'
                            key={index}
                        >
                            <div>
                                <p className='text-lg font-bold mb-2 text-[#ff4d2d]'>{shopOrder.shop?.name}</p>
                                <p className='font-semibold'>
                                    <span>Items:</span> {shopOrder.shopOrderItems?.map(i => i.name).join(", ")}
                                </p>
                                <p><span className='font-semibold'>Subtotal:</span> {shopOrder.subtotal}</p>
                                <p>
                                    <span className='mt-6 font-semibold'>Delivery Address:</span>{" "}
                                    {currentOrder?.deliveryAddress?.text}
                                </p>
                            </div>

                            {shopOrder?.status !== "Delivered" ? (
                                assignedBoy ? (
                                    <div>
                                        <p className='font-semibold'>
                                            Delivery Boy Name:{" "}
                                            <span className='text-sm text-gray-600'>
                                                {assignedBoy?.fullName}
                                            </span>
                                        </p>
                                        <p className='font-semibold'>
                                            Delivery Boy Contact:
                                            <span className='text-sm text-gray-600'>
                                                {" "}
                                                {assignedBoy?.mobile}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className='font-semibold'>Delivery Boy is not assigned yet</p>
                                )
                            ) : (
                                <p className='text-green-600 font-semibold text-lg'>Delivered</p>
                            )}

                            {assignedBoy && shopOrder?.status !== "Delivered" && (
                                <div className='h-[400px] w-full rounded-2xl overflow-hidden shadow-md'>
                                    <DeliveryBoyTracking
                                        data={{
                                            deliveryBoyLocation,
                                            customerLocation: {
                                                lat: currentOrder?.deliveryAddress?.latitude ?? 0,
                                                lon: currentOrder?.deliveryAddress?.longitude ?? 0,
                                            },
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default TrackOrderPage;
