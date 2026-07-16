import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setMyShopData } from "../redux/ownerSlice";

const useGetMyShop = () => {
    const dispatch = useDispatch();

    const { userData } = useSelector((state) => state.user);

    useEffect(() => {
        if (!userData?._id) {
            return undefined;
        }

        // Only a shop owner should request /api/shop/get-my
        if (userData.role !== "owner") {
            dispatch(setMyShopData(null));
            return undefined;
        }

        const controller = new AbortController();

        const fetchShop = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/shop/get-my`,
                    {
                        withCredentials: true,
                        signal: controller.signal,
                    }
                );

                dispatch(setMyShopData(data));
            } catch (error) {
                if (
                    error?.name === "CanceledError" ||
                    error?.code === "ERR_CANCELED"
                ) {
                    return;
                }

                if (error?.response?.status === 404) {
                    dispatch(setMyShopData(null));
                    return;
                }

                console.error("Get my shop error:", error);
            }
        };

        fetchShop();

        return () => {
            controller.abort();
        };
    }, [dispatch, userData?._id, userData?.role]);

    return null;
};

export default useGetMyShop;