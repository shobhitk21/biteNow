import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IoIosArrowRoundBack } from "react-icons/io";
import UserOrderCard from '../components/UserOrderCard';
import OwnerOrderCard from '../components/OwnerOrderCard';
import { setMyOrders, updateRealtimeOrderStatus } from '../redux/userSlice';

const MyOrders = () => {
    const { userData, myOrders, socket } = useSelector(state => state.user)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        if (!socket || !userData?._id) return;

        const handleNewOrder = (data) => {
            if (data?.shopOrders?.owner?._id === userData?._id) {
                dispatch(setMyOrders([data, ...myOrders]));
            }
        }
        socket?.on("newOrder", handleNewOrder);

        socket?.on("update-status", ({ orderId, shopId, status, userId }) => {
            if (userData.role === "owner" || userId === userData._id) {
                dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
            }
        });

        return () => {
            socket?.off("newOrder", handleNewOrder);
            socket?.off("update-status");
        };
    }, [userData?._id, dispatch, myOrders])



    return (
        <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
            <div className='w-full max-w-[800px] p-4'>
                <div className='flex items-center gap-[20px] mb-6'>
                    <div className='z-[10] cursor-pointer' onClick={() => navigate("/")}>
                        <IoIosArrowRoundBack size={45} className='text-primaryColor' />
                    </div>
                    <h1 className='text-2xl font-bold text-start'>My Orders</h1>
                </div>

                {
                    myOrders?.length === 0
                        ? <div className='text-gray-500 text-lg text-center'>No orders found</div>
                        : <div className='sapce-y-6'>
                            {
                                myOrders?.map((order, index) => (
                                    userData.role === "user"
                                        ? (<UserOrderCard data={order} key={index} />)
                                        : userData.role === "owner"
                                            ? (<OwnerOrderCard data={order} key={index} />)
                                            : null
                                ))
                            }
                        </div>
                }

            </div>
        </div>

    )
}

export default MyOrders