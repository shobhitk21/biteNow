import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners';
import { useDispatch } from "react-redux";
import { setUserData } from '../redux/userSlice';



const SignIn = () => {

    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState("user")
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()



    const handleSignIn = async (event) => {
        setLoading(true)
        event.preventDefault()
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signin`, { email, password }, { withCredentials: true })
            dispatch(setUserData(data))
            toast.success(data.message);
            setLoading(false)


        } catch (error) {
            toast.error(error.response?.data?.message);
            setLoading(false)

        }
    }

    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4 bg-bgColor'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md px-8 py-6 border-[1px] border-borderColor'>
                <h1 className='text-3xl font-bold mb-2 text-primaryColor'>Vingo</h1>
                <p className='text-gray-500 mb-5 text-sm'>Create account to get started with delicious food deliveries</p>


                <div className='mb-4'>
                    <label className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type="email"
                        className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className='mb-4'>
                    <label htmlFor='password' className='block text-gray-700 font-medium mb-1'>Password</label>
                    <div className='relative'>
                        <input type={showPassword ? 'text' : 'password'}
                            className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button className='absolute right-3 top-3 text-gray-500' onClick={() => setShowPassword(prev => !prev)}>{!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}</button>
                    </div>
                </div>
                <div className='text-right mb-4 cursor-pointer font-medium text-primaryColor' onClick={() => navigate("/forgot-password")}>
                    Forgot Password?
                </div>

                <button
                    className='w-full cursor-pointer font-semibold py-2 rounded-lg bg-primaryColor text-white hover:bg-hoverColor transition duration-200 '
                    onClick={handleSignIn}
                    disabled={loading}
                >
                    {loading ? <ClipLoader size={20} /> : "Sign In"}
                </button>

                <p onClick={() => navigate("/signup")} className='text-center mt-5 cursor-pointer'>Want to create an account? <span className='text-primaryColor'>Sign Up</span></p>

            </div>
        </div>
    )
}

export default SignIn