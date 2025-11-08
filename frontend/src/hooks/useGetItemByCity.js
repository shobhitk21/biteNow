import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setItemsInMyCity } from "../redux/userSlice"

const useGetItemByCity = () => {

    const dispatch = useDispatch()
    const { currentCity } = useSelector(state => state.user)


    useEffect(() => {
        const fetchItems = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/item/get-by-city/${currentCity}`, { withCredentials: true })
                dispatch(setItemsInMyCity(data))

            } catch (error) {
                console.log(error);
            }
        }
        if (currentCity) {
            fetchItems()
        }
    }, [currentCity])

}

export default useGetItemByCity
