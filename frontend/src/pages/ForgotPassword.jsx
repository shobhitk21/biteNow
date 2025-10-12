import React, { useState } from 'react'
import { IoArrowBack } from "react-icons/io5";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

const ForgotPassword = () => {

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setConfirmNewPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate();

    const handleSendOtp = async () => {
        setLoading(true)
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/send-otp`, { email }, { withCredentials: true });
            setStep(2);
            toast.success(data.message)
            setLoading(false)

        } catch (error) {
            toast.error(error.response?.data?.message);
            setLoading(false)

        }
    }

    const handleVerifyOtp = async () => {
        setLoading(true)

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`, { email, otp }, { withCredentials: true });
            toast.success(data.message)
            setStep(3);
            setLoading(false)


        } catch (error) {
            toast.error(error.response?.data?.message);
            setLoading(false)

        }
    }

    const handleResetPassword = async () => {
        setLoading(true)

        if (newPassword != confirmPassword) {
            return toast.error("Password does not match");
            setLoading(false)

        }
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-passsword`, { email, newPassword }, { withCredentials: true });
            toast.success(data.message)
            navigate("/signin");
            setLoading(false)

        } catch (error) {
            toast.error(error.response?.data?.message);
            setLoading(false)

        }
    }

    return (
        <div className='flex w-full items-center justify-center min-h-screen p-4 bg-bgColor'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>
                <div className='flex items-center gap-2'>
                    <IoArrowBack className='text-primaryColor cursor-pointer text-3xl pt-1' onClick={() => navigate("/signin")} />
                    <h1 className='text-2xl font-bold text-center text-primaryColor'>Forgot Password</h1>
                </div>

                {
                    step === 1
                    &&
                    <div>
                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 mt-4'>Email</label>
                            <input type="email"
                                className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            className='w-full cursor-pointer font-semibold py-2 rounded-lg bg-primaryColor text-white hover:bg-hoverColor transition duration-200 '
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} /> : "Send OTP"}
                        </button>
                    </div>
                }

                {
                    step === 2
                    &&
                    <div>
                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 mt-4'>OTP</label>
                            <input type="text"
                                className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            className='w-full cursor-pointer font-semibold py-2 rounded-lg bg-primaryColor text-white hover:bg-hoverColor transition duration-200 '
                            onClick={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} /> : "Verify OTP"}
                        </button>
                    </div>
                }

                {
                    step === 3
                    &&
                    <div>
                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1'>New Password</label>
                            <div className='relative'>
                                <input type={showNewPassword ? 'text' : 'password'}
                                    className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <button className='absolute right-3 top-3 text-gray-500' onClick={() => setShowNewPassword(prev => !prev)}>{!showNewPassword ? <FaRegEye /> : <FaRegEyeSlash />}</button>
                            </div>
                        </div>

                        <div className='mb-4'>
                            <label htmlFor='password' className='block text-gray-700 font-medium mb-1'>Confirm Password</label>
                            <div className='relative'>
                                <input type={showConfirmPassword ? 'text' : 'password'}
                                    className='w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 '
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button className='absolute right-3 top-3 text-gray-500' onClick={() => setConfirmNewPassword(prev => !prev)}>{!showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}</button>
                            </div>
                        </div>

                        <button
                            className='w-full cursor-pointer font-semibold py-2 rounded-lg bg-primaryColor text-white hover:bg-hoverColor transition duration-200 '
                            onClick={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} /> : "Reset Password"}
                        </button>
                    </div>
                }


            </div>
        </div>
    )
}

export default ForgotPassword