import axios from "axios"
import { useEffect, useContext } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setCurrentAddress, setCurrentCity, setCurrentState } from "../redux/userSlice"

const useGetCity = () => {

    const { userData } = useSelector(state => state.user)
    const dispatch = useDispatch()
    const apikey = import.meta.env.VITE_GEOAPIKEY


    useEffect(() => {

        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apikey}`)
            dispatch(setCurrentCity(result?.data?.results[0]?.city))
            dispatch(setCurrentState(result?.data?.results[0]?.state))
            dispatch(setCurrentAddress(result?.data?.results[0]?.formatted))

        })

    }, [userData])

}

export default useGetCity
