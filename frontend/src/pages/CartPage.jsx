import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IoIosArrowRoundBack } from "react-icons/io";
import CardItemCard from '../components/CardItemCard';


const CartPage = () => {
  const navigate = useNavigate()
  const { cartItems, totalAmount } = useSelector(state => state.user)

  return (
    <div className='min-h-screen bg-[#fff9f6] flex justify-center p-6'>
      <div className='w-full max-w-[800px]'>
        <div className='flex items-center gap-[20px] mb-6'>
          <div className='z-[10] cursor-pointer' onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={45} className='text-primaryColor' />
          </div>
          <h1 className='text-2xl font-bold text-start'>My Cart</h1>
        </div>
        {cartItems?.length == 0 ? (
          <p className='text-gray-500 text-lg text-center'>Your Cart is Empty</p>
        ) : (<>
          <div className='space-y-4'>
            {
              cartItems?.map((item, index) => (
                <CardItemCard key={index} data={item} />
              ))
            }
          </div>
          <div className='mt-6 bg-white p-4 rounded-xl shadow flex justify-between items-center border'>
            <h1 className='text-lg font-semibold'>Total Amount</h1>
            <span className='text-xl font-bold text-primaryColor'>₹{totalAmount}</span>
          </div>
          <div className='mt-4 flex justify-end'>
            <button
              className='bg-primaryColor text-white px-6 py-3 rounded-lg text-lg font-medium cursor-pointer hover:bg-hoverColor transition'
              onClick={() => navigate('/checkout')}>
              Buy Now
            </button>
          </div>
        </>
        )}
      </div>
    </div>

  )
}

export default CartPage