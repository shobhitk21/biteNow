import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import auth from '../../firebse'
import { ClipLoader } from 'react-spinners';
import { setUserData } from '../redux/userSlice';
import { useDispatch } from "react-redux"


const SignUp = () => {

    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState("user")
    const navigate = useNavigate()
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [mobile, setMobile] = useState("")
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()


    const handleSignUp = async (event) => {
        setLoading(true)
        event.preventDefault()
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, { fullName, email, password, mobile, role }, { withCredentials: true })
            dispatch(setUserData(data))
            setLoading(false)
            toast.success(data.message);
            setLoading(false)
        } catch (error) {
            toast.error(error.response?.data?.message);
            setLoading(false)
        }
    }

    const handleGoogleAuth = async () => {

        if (!mobile) {
            return toast.error("Enter mobile Number");
        }
        if (mobile.length !== 10) {
            return toast.error("Mobile Number should be of 10 digit");
        }
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google-auth`, {
                fullName: result.user.displayName,
                email: result.user.email,
                mobile,
                role,
            }, { withCredentials: true })
            dispatch(setUserData(data))
        } catch (error) {
            toast.error(error.response?.data?.message);
        }

    }

    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4 bg-bgColor'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md px-8 py-6 border-[1px] border-borderColor'>
                <h1 className='text-3xl font-bold mb-2 text-primaryColor'>Vingo</h1>
                <p className='text-gray-500 mb-5 text-sm'>Create account to get started with delicious food deliveries</p>

                <div className='mb-4'>
                    <label className='block text-gray-700 font-medium mb-1'>Full Name</label>
                    <input type="text"
                        className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                </div>

                <div className='mb-4'>
                    <label className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type="email"
                        className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className='mb-4'>
                    <label htmlFor='mobile' className='block text-gray-700 font-medium mb-1'>Mobile</label>
                    <input type="number"
                        className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
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
                        />
                        <button className='absolute right-3 top-3 text-gray-500' onClick={() => setShowPassword(prev => !prev)}>{!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}</button>
                    </div>
                </div>

                <div className='mb-4'>
                    <div className='flex gap-2'>
                        {
                            ["user", "owner", "deliveryBoy"].map((r, index) => (
                                <button key={index}
                                    onClick={() => setRole(r)}
                                    className={`flex-1 cursor-pointer border  rounded-lg px-3 py-2 text-center font-medium ${role === r ? "bg-primaryColor text-white" : "text-primaryColor"}`}

                                >{r}</button>
                            ))
                        }
                    </div>
                </div>

                <button
                    className='w-full cursor-pointer font-semibold py-2 rounded-lg bg-primaryColor text-white hover:bg-hoverColor transition duration-200 '
                    onClick={handleSignUp}
                    disabled={loading}
                >
                    {loading ? <ClipLoader size={20} /> : "Sign Up"}
                </button>

                <button
                    className='w-full mt-4 flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-200 transition duration-200 '
                    onClick={handleGoogleAuth}>
                    <FcGoogle /> <span>Sign up with google</span>
                </button>

                <p onClick={() => navigate("/signin")} className='text-center mt-5 cursor-pointer'>Already have an account? <span className='text-primaryColor'>Sign In</span></p>


            </div>
        </div>
    )
}

export default SignUp