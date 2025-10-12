import axios from "axios"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setMyShopData } from "../redux/ownerSlice"

const useGetMyShop = () => {

    const dispatch = useDispatch()


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
    }, [])

}

export default useGetMyShop
