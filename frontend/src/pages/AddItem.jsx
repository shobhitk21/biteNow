import React, { useRef, useState } from 'react'
import { IoArrowBack } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { FaUtensils } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { setMyShopData } from '../redux/ownerSlice';
import { toast } from 'react-toastify';
import axios from 'axios';

const AddItem = () => {
    const navigate = useNavigate()
    const { myShopData } = useSelector(state => state.owner)
    const dispatch = useDispatch()

    const [name, setName] = useState("")
    const [frontendImage, setFrontendImage] = useState(null)
    const [backendImage, setBackendImage] = useState(null)
    const [price, setPrice] = useState(0)
    const [category, setCategory] = useState("")
    const [foodType, setFoodType] = useState("Veg")
    const categories = ["Snacks", "Main Course", "Desserts", "Pizza", "Burgers", "sandwiches", "South Indian", "North Indian", "Chinese", "Fast Food", "Others"]

    const handleImage = (e) => {
        const file = e.target.files[0]
        setBackendImage(file)
        setFrontendImage(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("price", price)
            formData.append("foodType", foodType)
            formData.append("category", category)


            if (backendImage) {
                formData.append("image", backendImage)
            }
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/item/add-item`, formData, { withCredentials: true })
            dispatch(setMyShopData(data))
            console.log(data);

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message);

        }
    }


    return (
        <div className='flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-white min-h-screen'>
            <div className='absolute top-[20px] left-[20px] z-[10] mb-[10px] cursor-pointer' onClick={() => navigate("/")}>
                <IoArrowBack size={35} className='text-primaryColor' />
            </div>

            <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100'>
                <div className='flex flex-col items-center mb-6'>
                    <div className='bg-orange-100 p-4 rounded-full mb-4'>
                        <FaUtensils className='text-primaryColor h-16 w-16' />
                    </div>
                    <div className='text-3xl font-extrabold text-gray-900'>
                        Add Food Item
                    </div>
                </div>

                <form className='space-y-5' onSubmit={handleSubmit}>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                        <input
                            type="text"
                            placeholder='Enter Food Name'
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Food Image</label>
                        <input
                            type="file"
                            accept='image/*'
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={handleImage}
                        />
                        {
                            frontendImage && <div className='mt-4'>
                                <img src={frontendImage} alt="" className='w-full h-48 object-contain rounded-lg border' />
                            </div>
                        }

                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Price</label>
                        <input
                            type="number"
                            placeholder='0'
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Price</label>
                        <select
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={(e) => setCategory(e.target.value)}
                            value={category}>
                            <option value="">Select Category</option>
                            {
                                categories.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Price</label>
                        <select
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={(e) => setFoodType(e.target.value)}
                            value={foodType}>
                            <option value="Veg">Veg</option>
                            <option value="Non Veg">Non Veg</option>
                        </select>
                    </div>

                    <button onClick={handleSubmit} className='w-full bg-primaryColor text-white px-6 py-3 rounded-lg cursor-pointer font-semibold shadow-md hover:bg-hoverColor hover:shadow-lg transition-all duration-200'>
                        Save
                    </button>

                </form>

            </div >

        </div >

    )
}

export default AddItem