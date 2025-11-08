import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import axios from 'axios'
import DeliveryBoyTracking from './DeliveryBoyTracking'

const DeliveryBoy = () => {
  const { userData } = useSelector(state => state.user)
  const [availableAssignments, setAvailableAssignments] = useState(null)
  const [currentOrder, setCurrentOrder] = useState()
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [otp, setOtp] = useState("")

  const getAssignments = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/order/get-assignments`, { withCredentials: true });
      setAvailableAssignments(data)

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message)
    }
  }

  const acceptOrder = async (assignmentId) => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/order/accept-order/${assignmentId}`, {}, { withCredentials: true });
      toast.success(data.message);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    }
  }

  const getCurrentOrder = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/order/get-current-order`, { withCredentials: true });
      setCurrentOrder(data)

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    }
  }


  const sendOtp = async () => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/order/send-delivery-otp`, {
        orderId: currentOrder.order._id, shopOrderId: currentOrder.shopOrder._id
      }, { withCredentials: true });
      toast.success(data.message)
      setShowOtpBox(true)

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    }
  }

  const verifyOtp = async () => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/order/verify-delivery-otp`, {
        orderId: currentOrder.order._id, shopOrderId: currentOrder.shopOrder._id, otp
      }, { withCredentials: true });
      toast.success(data.message)

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    }
  }


  useEffect(() => {
    getAssignments()
    getCurrentOrder()
  }, [userData])

  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-bgColor overflow-y-auto mb-6'>
      <Nav />
      <div className='w-full max-w-[800px] flex flex-col gap-5 items-center'>
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>
            Welcome, {userData.fullName}
          </h1>
          <p className='text-[#ff4d2d]'>
            <span className='font-semibold'>Latitude:</span> {userData.location.coordinates[1]},
            <span className='font-semibold'>Longitude:</span> {userData.location.coordinates[0]}
          </p>
        </div>

        {
          !currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
            <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>
              Available Orders
            </h1>
            <div className='space-y-4'>
              {availableAssignments?.length > 0 ? (
                availableAssignments.map((a, index) => (
                  <div key={index} className='border rounded-lg p-4 flex justify-between items-center'>
                    <div>
                      <p className='text-sm font-semibold'>{a?.shopName}</p>
                      <p className='text-sm text-gray-500'><span className='font-semibold'>Delivery Address:</span> {a?.deliveryAddress.text}</p>
                      <p className='text-sm text-gray-500'>{a?.items?.length} items | ₹{a?.subtotal}</p>
                    </div>
                    <button
                      className='bg-primaryColor text-white px-4 py-1 rounded-lg text-sm hover:bg-hoverColor'
                      onClick={() => acceptOrder(a?.assignmentId)}>Accept</button>
                  </div>
                ))
              ) : (
                <p className='text-gray-400 text-sm'>No Available Orders</p>
              )}
            </div>
          </div>
        }

        {
          currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
            <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>
              Current Order
            </h1>
            <div className='space-y-4'>
              <div className='border rounded-lg p-4'>
                <p className='text-sm font-semibold'>{currentOrder?.shopName}</p>
                <p className='text-sm text-gray-500'><span className='font-semibold'>Delivery Address:</span> {currentOrder?.deliveryAddress.text}</p>
                <p className='text-sm text-gray-500'>{currentOrder?.shopOrder?.shopOrderItems?.length} item | ₹{currentOrder?.shopOrder?.subtotal}</p>
                <div className='mt-2'>
                  <h2 className='font-semibold'>Items:</h2>
                  <ul className='list-disc list-inside'>
                    {currentOrder?.shopOrder?.shopOrderItems?.map((item, index) => (
                      <li key={index} className='text-sm text-gray-600'>{item.name} x {item.quantity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <DeliveryBoyTracking data={currentOrder} />

            {
              !showOtpBox
                ? <button
                  className='mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200'
                  onClick={sendOtp}>
                  Mark as Delivered
                </button>
                : <div className='mt-4 p-2 border rounded-xl bg-gray-50 '>
                  <p className='text-sm font-semibold mb-2'>Enter OTP send to <span className='text-primaryColor'>{currentOrder.user.fullName}</span></p>
                  <input
                    type="text"
                    className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-none'
                    onChange={(e) => setOtp(e.target.value)}
                    value={otp} />
                  <button
                    className="w-full bg-primaryColor text-white py-2 rounded-lg font-semibold hover:bg-hoverColor transition-all cursor-pointer"
                    onClick={verifyOtp}>
                    Submit OTP
                  </button>

                </div>

            }


          </div>
        }



      </div>
    </div>
  )
}

export default DeliveryBoy