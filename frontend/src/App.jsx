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
import CreateEditShop from './pages/createEditShop.jsx'
import AddItem from './pages/AddItem.jsx'
import EditItem from './pages/EditItem.jsx'
import useGetShopByCity from './hooks/useGetShopByCity.js'
import useGetItemByCity from './hooks/useGetItemByCity.js'

function App() {
  useGetCurrentUser()
  useGetCity()
  useGetMyShop()
  useGetShopByCity()
  useGetItemByCity()
  const { userData } = useSelector(state => state.user)
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

      </Routes>
    </>
  )
}

export default App
