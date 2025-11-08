import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoArrowBack } from "react-icons/io5";
import DeliveryBoyTracking from '../components/DeliveryBoyTracking';


const TrackOrderPage = () => {

    const { orderId } = useParams();
    const [currentOrder, setCurrentOrder] = useState()
    const navigate = useNavigate()

    const handleGetOrder = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/order/get-order-by-id/${orderId}`, { withCredentials: true });
            setCurrentOrder(data)

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message);
        }
    }

    useEffect(() => {

        handleGetOrder()

    }, [orderId])


    return (
        <div className='max-w-4xl mx-auto p-4 flex flex-col gap-6'>
            <div className='relative top-[20px] left-[20px] z-[10] mb-[10px] cursor-pointer' onClick={() => navigate("/")}>
                <IoArrowBack size={35} className='text-primaryColor' />
                <h1 className='text-2xl font-bold md:text-center'>Track Order</h1>
            </div>
            {currentOrder?.shopOrders?.map((shopOrder, index) => (
                <div className='bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4' key={index}>
                    <div>
                        <p className='text-lg font-bold mb-2 text-[#ff4d2d]'>{shopOrder.shop.name}</p>
                        <p className='font-semibold'>
                            <span>Items:</span> {shopOrder.shopOrderItems?.map(i => i.name).join(", ")}
                        </p>
                        <p><span className='font-semibold'>Subtotal:</span> {shopOrder.subtotal}</p>
                        <p><span className='mt-6 font-semibold'>Delivery Address:</span> {currentOrder?.deliveryAddress?.text}</p>
                    </div>
                    {
                        shopOrder?.status != "Delivered"
                            ? <>
                                {
                                    shopOrder?.assignedDeliveryBoy
                                        ? <div >
                                            <p className='font-semibold'>Delivery Boy Name: <span className='text-sm text-gray-600'>{shopOrder?.assignedDeliveryBoy?.fullName}</span ></p>
                                            <p className='font-semibold'>Delivery Boy Contact:<span className='text-sm text-gray-600'> {shopOrder?.assignedDeliveryBoy?.mobile}</span></p>
                                        </div>
                                        : <p className='font-semibold'>Delivery Boy is not assigned yet</p>
                                }
                            </>
                            : <p className='text-green-600 font-semibold text-lg'>Delivered</p>
                    }

                    {
                        shopOrder?.assignedDeliveryBoy && shopOrder?.status != "Delivered" &&
                        <div className='h-[400px] w-full rounded-2xl overflow-hidden shadow-md '>
                            <DeliveryBoyTracking data={{
                                deliveryBoyLocation: {
                                    lat: shopOrder?.assignedDeliveryBoy?.location.coordinates[1],
                                    lon: shopOrder?.assignedDeliveryBoy?.location.coordinates[0]
                                },
                                customerLocation: {
                                    lat: currentOrder?.deliveryAddress?.latitude,
                                    lon: currentOrder?.deliveryAddress?.longitude
                                }
                            }} />
                        </div>
                    }
                </div>
            ))}

        </div>
    )
}

export default TrackOrderPage