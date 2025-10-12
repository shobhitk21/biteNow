import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../../components/UserDashboard'
import OwnerDashboard from '../../components/OwnerDashboard'
import DeliverBoy from '../../components/DeliverBoy'

const Home = () => {
    const userData = useSelector(state => state.user)
    return (
        <div className='width-[100vw] height-[100vh] pt-[100px] bg-bgColor flex flex-col items-center'>
            {userData?.userData?.role === 'user' && <UserDashboard />}
            {userData?.userData?.role === 'owner' && <OwnerDashboard />}
            {userData?.userData?.role === 'deliveryBoy' && <DeliverBoy />}

        </div>
    )
}

export default Home