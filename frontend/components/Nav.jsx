import React, { useState } from 'react'
import { MdLocationPin } from "react-icons/md";
import { IoMdSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { useDispatch, useSelector } from 'react-redux';
import { RxCross2 } from "react-icons/rx";
import { setUserData } from '../src/redux/userSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaPlus } from "react-icons/fa";
import { LuReceiptIndianRupee } from "react-icons/lu";
import { useNavigate } from 'react-router-dom';

const Nav = () => {
    const { userData, currentCity } = useSelector(state => state.user)
    const { myShopData } = useSelector(state => state.owner)

    const [showInfo, setShowInfo] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLogOut = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message);
        }
    }

    return (
        <div className='w-full h-[80px] flex items-center justify-between md:justify-center gap-[30px] px-[20px] fixed top-0 z-[9999] bg-bgColor overflow-visible '>
            <h1 className='text-3xl font-bold mb-2 text-primaryColor'>BiteNow</h1>

            {
                userData.role === "user" && <div className='md:w-[60%] lg:w-[40%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px] hidden md:flex'>
                    <div className='flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-400'>
                        <MdLocationPin size={25} className=' text-primaryColor' />
                        <div className='w-[80%] truncate text-gray-600'>{currentCity}</div>
                    </div>

                    <div className='w-[80%] flex items-center gap-[10px]'>
                        <IoMdSearch size={25} className='text-primaryColor' />
                        <input className='px-[10px] text-gray-700 outline-0 w-full' type="text" placeholder='search delicious food' />
                    </div>
                </div>
            }

            <div className='flex items-center'>

                {/* for mobile search button */}
                {
                    userData.role === "user" && (
                        showSearch
                            ? <RxCross2 onClick={() => setShowSearch(false)} size={25} className='text-primaryColor md:hidden' />
                            : <IoMdSearch onClick={() => setShowSearch(true)} size={25} className='text-primaryColor md:hidden' />
                    )
                }

                {
                    showSearch && userData.role === "user" && <div className='w-[90%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px] flex fixed top-[80px] left-[5%] md:hidden'>
                        <div className='flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-400'>
                            <MdLocationPin size={25} className=' text-primaryColor' />
                            <div className='w-[80%] truncate text-gray-600'>{currentCity}</div>
                        </div>
                        <div className='w-[70%] flex items-center gap-[10px]'>
                            <IoMdSearch size={25} className='text-primaryColor' />
                            <input className='px-[10px] text-gray-700 outline-0 w-full' type="text" placeholder='search food' />
                        </div>
                    </div>
                }

                {
                    // add to cart and my order buttons for user
                    userData.role === "user" && <> <div className='relative cursor-pointer m-4'>
                        <FiShoppingCart size={25} className='text-primaryColor' />
                        <span className='absolute right-[-9px] top-[-12px] text-primaryColor '>0</span>
                    </div>
                        <button className='hidden md:block px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-primaryColor m-4 text-sm font-medium'>
                            My Orders
                        </button>
                    </>
                }

                {
                    // add food items and my orders for owner
                    userData.role === "owner" && myShopData && <>
                        <button onClick={() => navigate("/add-item")} className='flex items-center px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-primaryColor cursor-pointer text-sm font-medium'>
                            <FaPlus size={20} />
                            <span className='hidden md:flex'>Add Food Item</span>
                        </button>
                        <div className='flex items-center cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium m-2 md:m-4'>
                            <LuReceiptIndianRupee size={20} />
                            <span className='hidden md:flex'>My Orders</span>
                            <span className='absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-[6px] py-[1px]'>0</span>

                        </div>
                    </>
                }

                {/* user account pop-up */}
                <div onClick={() => setShowInfo(prev => !prev)} className='w-[40px] h-[40px] rounded-full flex items-center justify-center bg-primaryColor text-white text-[18px] shadow-xl font-semibold cursor-pointer'>
                    {userData?.fullName?.slice(0, 1)}
                </div>
                {
                    showInfo &&
                    <div className='fixed top-[80px] right-[10px] md:right-[10%] lg:right-[25%] w-[180px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999]'>
                        <div className='text-[17px] font-semibold'>{userData?.fullName}</div>
                        <div className='md:hidden font-semibold cursor-pointer text-primaryColor'>My Orders</div>
                        <div onClick={handleLogOut} className='text-primaryColor font-semibold text-[17px] cursor-pointer'>Log Out</div>
                    </div>
                }
            </div>
        </div>
    )
}

export default Nav