import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

const useUpdateLocation = () => {

    const { userData } = useSelector(state => state.user)
    const dispatch = useDispatch()

    useEffect(() => {
        const updateLocation = async (lat, lon) => {
            const data = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/update-location`, { lat, lon }, { withCredentials: true })
        }

        navigator.geolocation.watchPosition((pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude)
        })
    }, [userData])

}

export default useUpdateLocation
