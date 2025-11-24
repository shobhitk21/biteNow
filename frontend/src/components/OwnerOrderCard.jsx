import axios from 'axios';
import React, { useState } from 'react'
import { MdPhone } from "react-icons/md";
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';

const OwnerOrderCard = ({ data }) => {

    const [availableBoys, setAvailableBoys] = useState([])

    const dispatch = useDispatch()
    const handleUpdateStatus = async (orderId, shopId, status) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/order/update-status/${orderId}/${shopId}`, { status }, { withCredentials: true });
            dispatch(updateOrderStatus({ orderId, shopId, status }))
            setAvailableBoys(data?.availableBoys);
        } catch (error) {
            console.log(error);
        }
    };

    return (

        <div className='bg-white rounded-lg shadow p-4 space-y-4 mb-6'>

            <div>
                <h2 className='text-lg font-semibold text-gray-800'>{data?.user.fullName}</h2>
                <p className='text-sm text-gray-500'>{data?.user.email}</p>
                <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                    <MdPhone /> <span>{data.user.mobile}</span>
                </p>
                <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                    Payment: {
                        data.paymentMethod === "online"
                            ? <span className='text-green-400'>Paid</span>
                            : <span className='text-gray-800'>COD</span>
                    }
                </p>
            </div>

            <div className='flex items-start flex-col text-gray-600 text-sm'>
                <p>{data?.deliveryAddress?.text}</p>
                <p>Lat: {data?.deliveryAddress?.latitude}, Lon: {data?.deliveryAddress?.longitude}</p>
            </div>

            <div className='flex space-x-4 overflow-x-auto pb-2'>
                {data.shopOrders.shopOrderItems?.map((item, index) => (
                    <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                        <img src={item?.item?.image} alt='' className='w-full h-24 object-cover rounded' />
                        <p className='text-sm font-semibold mt-1'>{item.name}</p>
                        <p className='text-xs text-gray-500'> Qty {item.quantity} x ₹{item.price}  </p>
                    </div>
                ))}
            </div>

            <div className='flex justify-between items-center mt-auto pt-3 border-t border-gray-100'>
                <span className='text-sm'>
                    status: <span className='font-semibold capitalize text-primaryColor'>
                        {data.shopOrders.status}
                    </span>
                </span>

                {data.shopOrders.assignedDeliveryBoy
                    ? ""
                    : <p>                {
                        data.shopOrders.status !== "Delivered" && <select
                            className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-primaryColor text-primaryColor'
                            onChange={(e) => handleUpdateStatus(data._id, data.shopOrders._id, e.target.value)}
                        >
                            <option value="">Change</option>
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Out for delivery">Out for delivery</option>
                        </select>
                    }</p>
                }


            </div>

            {
                data.shopOrders.status == "Out for delivery" && <div className='mt-3 p-2 border rounded-lg text-sm bg-bgColor'>
                    {data.shopOrders.assignedDeliveryBoy
                        ? <p>Assigned Delivery Boy:</p>
                        : <p>Available Delivery Boys:</p>
                    }
                    {availableBoys?.length > 0
                        ? (availableBoys.map((b, index) => (
                            <div key={index} className='text-gray-500'>{b.fullName}-{b.mobile}</div>
                        )))
                        : data.shopOrders.assignedDeliveryBoy
                            ? <div>{data.shopOrders.assignedDeliveryBoy.fullName} - {data.shopOrders.assignedDeliveryBoy.mobile}</div>
                            : <div>Waiting for delivery boy to accept</div>
                    }

                </div>
            }

            <div className='text-right font-bold text-gray-800 text-sm'>
                Total: ₹{data.shopOrders.subtotal}
            </div>

        </div>

    )
}

export default OwnerOrderCard
