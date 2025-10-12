import React from 'react'
import { FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

const OwnerItemCard = ({ data }) => {
    const navigate = useNavigate()
    return (
        <div className='flex bg-white rounded-lg shadow-md overflow-hidden border border-[#ff4d2d] w-full max-w-2xl'>
            <div className='w-36 h-full flex-shrink-0 bg-gray-50'>
                <img src={data?.image} alt="" className='w-full h-full object-cover' />
            </div>
            <div className='flex flex-col justify-between p-3 flex-1'>
                <div>
                    <h2 className='text-base font-semibold text-[#ff4d2d]'>{data.name}</h2>
                    <p>
                        <span className='font-medium text-gray-700'>Category:</span> {data.category}
                    </p>
                    <p>
                        <span className='font-medium text-gray-700'>Food Type:</span> {data.foodType}
                    </p>
                </div>

                <div className='flex justify-between items-center'>
                    <div><span>₹</span>{data.price}</div>
                    <div className='flex gap-2'>
                        <div className='p-2 rounded-full text-primaryColor hover:bg-primaryColor/10 cursor-pointer '>
                            <FaPen />
                        </div>
                        <div className='p-2 rounded-full text-primaryColor hover:bg-primaryColor/10 cursor-pointer '>
                            <MdDelete />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default OwnerItemCard