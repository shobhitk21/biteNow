import React, { useEffect, useState } from 'react'
import { IoSearchOutline } from "react-icons/io5";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaLocationDot } from "react-icons/fa6";
import { TbCurrentLocation } from "react-icons/tb";
import { MapContainer, Marker, useMap, TileLayer } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import "leaflet/dist/leaflet.css"
import { useNavigate } from 'react-router-dom';
import { setLocation, setAddress } from '../redux/mapSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { MdDeliveryDining } from "react-icons/md";
import { FaMobileAlt, FaCreditCard } from "react-icons/fa";
import { addMyOrders } from '../redux/userSlice';

const RecenterMap = ({ location }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !location?.lat || !location?.lon) return;
    map.setView([location.lat, location.lon], 16, { animate: true });
  }, [map, location?.lat, location?.lon]);

  return null;
};


const CheckOut = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [addressInput, setAddressInput] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const { location, address } = useSelector(state => state.map)
  const { cartItems, totalAmount, userData } = useSelector(state => state.user)
  const apikey = import.meta.env.VITE_GEOAPIKEY
  const deliveryFee = totalAmount > 299 ? 0 : 40;
  const amountWithDeliveryFee = totalAmount + deliveryFee;

  const onDragEnd = (e) => {
    const { lat, lng } = e.target._latlng;
    dispatch(setLocation({ lat, lon: lng }))
    getAddressByLatLng(lat, lng);
  }

  const getCurrentLocation = async () => {
    const latitude = userData.location.coordinates[1]
    const longitude = userData.location.coordinates[0]
    dispatch(setLocation({ lat: latitude, lon: longitude }))
    getAddressByLatLng(latitude, longitude)
  }

  const getAddressByLatLng = async (lat, lng) => {
    try {
      const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apikey}`)
      dispatch(setAddress(result?.data?.results[0]?.formatted))

    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message)
    }
  }

  const getLatLngByAddress = async (address) => {
    try {
      const result = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&format=json&apiKey=${apikey}`)
      const { lat, lon } = await result.data.results[0]
      dispatch(setLocation({ lat, lon }))

    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message)
    }
  }

  const handlePlaceOrder = async () => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/order/place-order`, {
        paymentMethod,
        deliveryAddress: {
          text: address,
          latitude: location.lat,
          longitude: location.lon
        },
        totalAmount: amountWithDeliveryFee,
        cartItems
      }, { withCredentials: true })

      if (paymentMethod === "cod") {
        dispatch(addMyOrders(data))
        navigate("/order-placed")
      } else {
        const orderId = data.orderId
        const razorOrder = data.razorOrder
        openRazorpayWindow(orderId, razorOrder)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message)
    }
  }

  const openRazorpayWindow = (orderId, razorOrder) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorOrder.amount,
      currency: razorOrder.currency,
      name: "bitenow",
      description: "Food Delivery Payment",
      order_id: razorOrder.id,
      handler: async function (response) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/order/verify-payment`, {
            razorpayPaymentId: response.razorpay_payment_id,
            orderId
          }, { withCredentials: true })

          console.log(data);

          dispatch(addMyOrders(data))
          navigate("/order-placed")


        } catch (error) {
          console.log(error)
          toast.error(error?.response?.data?.message)
        }
      }

    }

    const rzp = new window.Razorpay(options)
    rzp.open()

  }

  useEffect(() => {
    setAddressInput(address)
  }, [address])


  return (
    <div className='min-h-screen bg-[#fff9f6] flex justify-center p-6'>
      <div className='w-full max-w-[800px]'>
        <div className='flex items-center gap-[20px] mb-6'>
          <div className='z-[10] cursor-pointer' onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={45} className='text-primaryColor' />
          </div>
          <h1 className='text-2xl font-bold text-start'>Checkout</h1>
        </div>
        <div className='w-full max-w-[900px] bg-white rounded-lg shadow-xl p-6 space-y-6'>

          <section>
            <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
              <FaLocationDot className='text-primaryColor' /> Delivery Location
            </h2>

            {/* Address Search Input */}
            <div className='flex gap-2 mb-3'>
              <input
                type="text"
                className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
                placeholder="Enter Your Delivery Address"
                value={addressInput || ""}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    getLatLngByAddress(addressInput)
                  }
                }}

              />
              <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-3 py-2 rounded flex items-center justify-center' onClick={() => getLatLngByAddress(addressInput)}>
                <IoSearchOutline size={17} />
              </button>
              <button className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded flex items-center justify-center' onClick={getCurrentLocation}>
                <TbCurrentLocation size={17} />
              </button>
            </div>

            {/* MAP */}
            <div className='rounded-lg border overflow-hidden'>
              <div className='h-64 w-full flex items-center justify-center'>
                {location?.lat && location?.lon && (
                  <MapContainer
                    className='w-full h-full'
                    center={[location?.lat, location?.lon]}
                    zoom={16}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap location={location} />
                    <Marker
                      position={[location.lat, location.lon]}
                      draggable
                      eventHandlers={{ dragend: onDragEnd }}
                    />
                  </MapContainer>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-lg font-semibold mb-3 text-gray-800'>Payment Method</h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${paymentMethod === "cod" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200"} hover:border-gray-300`}
                onClick={() => setPaymentMethod("cod")}>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                  <MdDeliveryDining size={24} className='text-green-600' />
                </span>
                <div>
                  <p className='font-medium text-gray-800'>Cash on delivery</p>
                  <p className='text-xs text-gray-500'>Pay when your food is arrived</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${paymentMethod === "online" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200"} hover:border-gray-300`}
                onClick={() => setPaymentMethod("online")}>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'><FaMobileAlt size={24} className='text-purple-700' /></span>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'><FaCreditCard size={24} className='text-blue-700' /></span>
                <div>
                  <p className='font-medium text-gray-800'>UPI / Credit / Debit Card</p>
                  <p className='text-xs text-gray-500'>Pay securely online</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Summary</h2>
            <div className='rounded-lg border bg-gray-50 p-4 space-y-2'>
              {cartItems?.map((item, index) => (
                <div key={index} className='flex justify-between text-sm text-gray-700'>
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <hr className='border-gray-300 my-2' />
              <div className='flex justify-between font-medium text-gray-800'>
                <span>Subtotal</span>
                <span>{totalAmount}</span>
              </div >
              <div className='flex justify-between text-sm text-gray-700'>
                <span>Delivery Fee</span>
                <span>{deliveryFee}</span>
              </div>
              <div>
                <hr className='border-gray-300 my-2' />
                <div className='flex justify-between font-bold text-lg text-primaryColor'>
                  <span>Total Amount</span>
                  <span>₹{amountWithDeliveryFee}</span>
                </div>
              </div>
            </div>
          </section>

          <button
            className='w-full bg-primaryColor hover:bg-hoverColor text-white px-6 py-3 rounded-lg text-lg font-semibold cursor-pointer transition'
            onClick={handlePlaceOrder}>
            {paymentMethod == "cod" ? "Place order" : "Pay & palce order"}
          </button>

        </div>
      </div>
    </div>
  )
}

export default CheckOut
