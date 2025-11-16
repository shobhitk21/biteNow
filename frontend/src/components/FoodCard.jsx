import React, { useState } from 'react'
import { FaStar } from "react-icons/fa6";
import { FaRegStar } from "react-icons/fa";
import { TbSquareDot } from "react-icons/tb";
import { FaMinus, FaPlus } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/userSlice';


const FoodCard = ({ data }) => {

    const [quantity, setQuantity] = useState(0)
    const dispatch = useDispatch()
    const { cartItems } = useSelector(state => state.user)

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<FaStar key={i} className="text-yellow-500 text-lg" />);
            } else {
                stars.push(<FaRegStar key={i} className="text-yellow-500 text-lg" />);
            }
        }
        return stars
    }

    const handleIncrease = () => {
        setQuantity(quantity + 1)
    }

    const handleDecrease = () => {
        if (quantity > 0) {
            setQuantity(quantity - 1)
        }
    }

    return (
        <div className='w-[250px] rounded-2xl border-2 border-[#ff4d2d] bg-white shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col'>
            <div className='relative w-full h-[170px] flex justify-center items-center bg-white'>
                <div className='absolute top-3 right-3 bg-white rounded-full p-1 shadow'>
                    {data.foodType == "Veg" ? <TbSquareDot className='text-green-600 text-lg' /> : <TbSquareDot className='text-red-600 text-lg' />}
                </div>
                <img src={data.image} alt="" className='w-full h-full object-cover transition-transform duration-300 hover:scale-105' />
            </div>

            <div className="flex-1 flex flex-col p-4">
                <h1 className='font-semibold text-gray-900 text-base truncate'>{data.name}</h1>

                <div className='flex items-center gap-1 mt-1'>
                    {renderStars(data.rating?.average || 0)}
                    <span className='text-xs text-gray-500 ml-2'>{data.rating?.count || 0}</span>
                </div>
            </div>

            <div className='flex items-center justify-between mt-auto p-3'>
                <span className='font-bold text-gray-900 text-lg'>
                    ₹{data.price}
                </span>

                <div className='flex items-center border rounded-full overflow-hidden shadow-sm'>
                    <button className='px-2 py-1 hover:bg-gray-100 cursor-pointer transition' onClick={handleDecrease}> <FaMinus size={15} /> </button>
                    <span>{quantity}</span>
                    <button className='px-2 py-1 hover:bg-gray-100 cursor-pointer transition' onClick={handleIncrease}> <FaPlus size={15} /> </button>
                    <button

                        onClick={() => {
                            quantity > 0
                                ? dispatch(addToCart({
                                    id: data._id, name: data.name, price: data.price, image: data.image, shop: data.shop, quantity, foodType: data.foodType
                                }))
                                : null
                        }}
                        className={`${cartItems.some(i => i.id === data._id) ? "bg-gray-800" : "bg-primaryColor"} text-white px-3 py-2  cursor-pointer transition-colors`}>
                        <FiShoppingCart />
                    </button>
                </div>
            </div>


        </div>

    )
}

export default FoodCard