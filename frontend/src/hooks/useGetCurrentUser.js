import axios from "axios"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { setUserData } from "../redux/userSlice"

const useGetCurrentUser = () => {

    const dispatch = useDispatch()
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/current`, { withCredentials: true })
                dispatch(setUserData(data))
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }
        fetchUser()
    }, [])
    return { loading };

}

export default useGetCurrentUser
