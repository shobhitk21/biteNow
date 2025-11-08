import { ToastContainer } from 'react-toastify'
import './Index.css'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import { Route, Routes, Navigate } from 'react-router-dom'
import ForgotPassword from './pages/ForgotPassword.jsx'
import useGetCurrentUser from './hooks/useGetCurrentUser.js'
import Home from './pages/Home.jsx'
import { useSelector } from 'react-redux'
import useGetCity from './hooks/useGetCity.js'
import useGetMyShop from './hooks/useGetMyShop.js'
import CreateEditShop from './pages/CreateEditShop.jsx'
import AddItem from './pages/AddItem.jsx'
import EditItem from './pages/EditItem.jsx'
import useGetShopByCity from './hooks/useGetShopByCity.js'
import useGetItemByCity from './hooks/useGetItemByCity.js'
import CartPage from './pages/CartPage.jsx'
import CheckOut from './pages/CheckOut.jsx'
import OrderPlaced from './pages/OrderPlaced.jsx'
import MyOrders from './pages/MyOrders.jsx'
import useGetMyOrders from './hooks/useGetMyOrders.js'
import useUpdateLocation from './hooks/useUpdateLocation.js'
import TrackOrderPage from './pages/TrackOrderPage.jsx'
import Shop from './pages/Shop.jsx'

function App() {

  const { loading } = useGetCurrentUser()
  useGetCity()
  useGetMyShop()
  useGetShopByCity()
  useGetItemByCity()
  useGetMyOrders()
  useUpdateLocation()
  const { userData } = useSelector(state => state.user)
  if (loading) return <div className="text-center mt-10 text-lg font-semibold">Loading...</div>

  return (
    <>
      <ToastContainer />

      <Routes>
        <Route path='/' element={userData ? <Home /> : <Navigate to="/signin" />} />
        <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to="/" />} />
        <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/create-edit-shop' element={userData ? <CreateEditShop /> : <Navigate to="/signin" />} />
        <Route path='/add-item' element={userData ? <AddItem /> : <Navigate to="/signin" />} />
        <Route path='/edit-item/:itemId' element={userData ? <EditItem /> : <Navigate to="/signin" />} />
        <Route path='/cart' element={userData ? <CartPage /> : <Navigate to="/signin" />} />
        <Route path='/checkout' element={userData ? <CheckOut /> : <Navigate to="/signin" />} />
        <Route path='/order-placed' element={userData ? <OrderPlaced /> : <Navigate to="/signin" />} />
        <Route path='/my-orders' element={userData ? <MyOrders /> : <Navigate to="/signin" />} />
        <Route path='/track-order/:orderId' element={userData ? <TrackOrderPage /> : <Navigate to="/signin" />} />
        <Route path='/shop/:shopId' element={userData ? <Shop /> : <Navigate to="/signin" />} />

      </Routes>
    </>
  )
}

export default App
