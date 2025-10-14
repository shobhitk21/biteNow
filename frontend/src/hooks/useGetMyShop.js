import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setMyShopData } from "../redux/ownerSlice"

const useGetMyShop = () => {

    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/shop/get-my`, { withCredentials: true })
                dispatch(setMyShopData(data))

            } catch (error) {
                console.log(error);
            }
        }
        fetchShop()
    }, [userData])

}

export default useGetMyShop
