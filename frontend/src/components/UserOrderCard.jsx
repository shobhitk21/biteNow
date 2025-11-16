// import axios from 'axios'
// import React from 'react'
// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { FaStar } from "react-icons/fa";

// const UserOrderCard = ({ data }) => {

//     const [selectedRating, setSelectedRating] = useState({})         // itemId : rating
//     const navigate = useNavigate()

//     const formatDate = (dateString) => {
//         const date = new Date(dateString)
//         return date.toLocaleString('en-GB', {
//             day: "2-digit",
//             month: "short",
//             year: "numeric"
//         })
//     }

//     const handleRatingChange = async (itemId, rating) => {
//         try {
//             const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/item/rating`, {
//                 itemId,
//                 rating
//             }, { withCredentials: true })

//             setSelectedRating(prev => ({
//                 ...prev, [itemId]: rating
//             }))

//         } catch (error) {
//             console.log(error)
//             toast.error(error?.respose?.data?.message)
//         }
//     }


//     return (
//         <div className='bg-white rounded-lg shadow-2xl p-4 space-y-4 mb-6'>
//             <div className='flex justify-between border-b pb-2'>
//                 <div>
//                     <p className='font-semibold'>
//                         order #{data._id.slice(-6)}
//                     </p>
//                     <p className='text-sm text-gray-500'>
//                         Date: {formatDate(data.createdAt)}
//                     </p>
//                 </div>

//                 <div className='text-right'>
//                     <p className='text-sm text-gray-500'>{data?.paymentMethod.toUpperCase()}</p>
//                     <div>{data?.paymentMethod === "online" && (<div>
//                         {data.payment
//                             ? <p className='text-sm text-green-400'>Payment Successfull</p>
//                             : <p className='text-sm text-red-400'>Payment Failed</p>}
//                     </div>)}
//                     </div>
//                 </div>
//             </div>

//             {data.shopOrders?.map((shopOrder, index) => (
//                 <div className='border rounded-lg p-3 bg-bgColor space-y-3' key={index}>
//                     <p>{shopOrder.shop.name}</p>

//                     <div className='flex space-x-4 overflow-x-auto pb-2'>
//                         {shopOrder.shopOrderItems?.map((item, index) => (
//                             <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
//                                 <img src={item?.item?.image} alt='' className='w-full h-24 object-cover rounded' />
//                                 <p className='text-sm font-semibold mt-1'>{item.name}</p>
//                                 <p className='text-xs text-gray-500'> Qty {item.quantity} x ₹{item.price}  </p>

//                                 {
//                                     shopOrder.status === "Delivered" && <div className='flex space-x-1 mt-2'>
//                                         {
//                                             [1, 2, 3, 4, 5].map((star) => (
//                                                 <button
//                                                     className={`text-lg ${selectedRating[item.item._id] >= star ? "text-yellow-400" : "text-gray-400"}`}
//                                                     onClick={() => handleRatingChange(item.item._id, star)}>
//                                                     <FaStar />
//                                                 </button>
//                                             ))
//                                         }
//                                     </div>
//                                 }
//                             </div>
//                         ))}
//                     </div>
//                     <div className='flex justify-between items-center border-t pt-2'>
//                         <p className='font-semibold'>Subtotal: {shopOrder.subtotal}</p>
//                         <span className='text-sm font-medium text-blue-600'>{shopOrder.status}</span>
//                     </div>
//                 </div>
//             ))}
//             <div className='flex justify-between items-center border-t pt-2'>
//                 <p className='font-semibold'>Total: ₹{data.totalAmount}</p>
//                 {<div>{(data?.paymentMethod === "online" && data.payment) || data?.paymentMethod === "cod"
//                     ? <button
//                         className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm cursor-pointer'
//                         onClick={() => navigate(`/track-order/${data._id}`)}>
//                         Track Order
//                     </button>
//                     : ""}

//                 </div>}

//             </div>

//         </div>

//     )
// }

// export default UserOrderCard


import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";

const UserOrderCard = ({ data }) => {
    const [selectedRating, setSelectedRating] = useState({}); // itemId : rating
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // 🟢 Fetch existing ratings for this user when component mounts
    useEffect(() => {
        const fetchUserRatings = async () => {
            try {
                const ratings = {};
                for (const shopOrder of data.shopOrders || []) {
                    for (const item of shopOrder.shopOrderItems || []) {
                        const res = await axios.get(
                            `${import.meta.env.VITE_BACKEND_URL}/api/item/${item.item._id}/rating`,
                            { withCredentials: true }
                        );
                        ratings[item.item._id] = res.data.rating || 0;
                    }
                }
                setSelectedRating(ratings);
            } catch (error) {
                console.error("Error fetching user ratings:", error);
            }
        };

        fetchUserRatings();
    }, [data]);

    // 🟢 Handle new rating
    const handleRatingChange = async (itemId, rating) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/item/rating`,
                { itemId, rating },
                { withCredentials: true }
            );

            setSelectedRating((prev) => ({
                ...prev,
                [itemId]: rating,
            }));

            toast.success("Thanks for your rating!");
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || "Failed to rate item");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-2xl p-4 space-y-4 mb-6">
            {/* Order header */}
            <div className="flex justify-between border-b pb-2">
                <div>
                    <p className="font-semibold">order #{data._id.slice(-6)}</p>
                    <p className="text-sm text-gray-500">
                        Date: {formatDate(data.createdAt)}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-sm text-gray-500">
                        {data?.paymentMethod.toUpperCase()}
                    </p>
                    {data?.paymentMethod === "online" && (
                        <div>
                            {data.payment ? (
                                <p className="text-sm text-green-400">Payment Successful</p>
                            ) : (
                                <p className="text-sm text-red-400">Payment Failed</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Each shop order */}
            {data.shopOrders?.map((shopOrder, index) => (
                <div
                    className="border rounded-lg p-3 bg-bgColor space-y-3"
                    key={index}
                >
                    <p className="font-semibold">{shopOrder.shop.name}</p>

                    <div className="flex space-x-4 overflow-x-auto pb-2">
                        {shopOrder.shopOrderItems?.map((item, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
                            >
                                <img
                                    src={item?.item?.image}
                                    alt=""
                                    className="w-full h-24 object-cover rounded"
                                />
                                <p className="text-sm font-semibold mt-1">{item.name}</p>
                                <p className="text-xs text-gray-500">
                                    Qty {item.quantity} × ₹{item.price}
                                </p>

                                {shopOrder.status === "Delivered" && (
                                    <div className="flex space-x-1 mt-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                className={`text-lg ${selectedRating[item.item._id] >= star
                                                        ? "text-yellow-400"
                                                        : "text-gray-400"
                                                    }`}
                                                onClick={() =>
                                                    handleRatingChange(item.item._id, star)
                                                }
                                            >
                                                <FaStar />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center border-t pt-2">
                        <p className="font-semibold">Subtotal: ₹{shopOrder.subtotal}</p>
                        <span className="text-sm font-medium text-blue-600">
                            {shopOrder.status}
                        </span>
                    </div>
                </div>
            ))}

            {/* Total + Track */}
            <div className="flex justify-between items-center border-t pt-2">
                <p className="font-semibold">Total: ₹{data.totalAmount}</p>
                {(data?.paymentMethod === "online" && data.payment) ||
                    data?.paymentMethod === "cod" ? (
                    <button
                        className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
                        onClick={() => navigate(`/track-order/${data._id}`)}
                    >
                        Track Order
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default UserOrderCard;
