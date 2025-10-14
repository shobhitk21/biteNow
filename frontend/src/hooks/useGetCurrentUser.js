import axios from "axios"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setUserData } from "../redux/userSlice"

const useGetCurrentUser = () => {

    const dispatch = useDispatch()


    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/current`, { withCredentials: true })
                dispatch(setUserData(data))

            } catch (error) {
                console.log(error);
            }
        }
        fetchUser()
    }, [])

}

export default useGetCurrentUser
