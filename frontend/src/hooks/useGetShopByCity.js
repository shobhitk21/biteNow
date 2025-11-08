import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setShopsInMyCity } from "../redux/userSlice"

const useGetShopByCity = () => {

    const dispatch = useDispatch()
    const { currentCity } = useSelector(state => state.user)


    useEffect(() => {
        const fetchShops = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/shop/get-by-city/${currentCity}`, { withCredentials: true })
                dispatch(setShopsInMyCity(data))

            } catch (error) {
                console.log(error);
            }
        }
        if (currentCity) {
            fetchShops()
        }
    }, [currentCity])

}

export default useGetShopByCity
