import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setMyOrders } from "../redux/userSlice"

const useGetMyOrders = () => {

    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/order/my-orders`, { withCredentials: true })
                dispatch(setMyOrders(data))

            } catch (error) {
                console.log(error);
            }
        }
        fetchOrders()
    }, [userData])

}

export default useGetMyOrders
