import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";

import "./Index.css";

import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Home from "./pages/Home.jsx";
import CreateEditShop from "./pages/CreateEditShop.jsx";
import AddItem from "./pages/AddItem.jsx";
import EditItem from "./pages/EditItem.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckOut from "./pages/CheckOut.jsx";
import OrderPlaced from "./pages/OrderPlaced.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import TrackOrderPage from "./pages/TrackOrderPage.jsx";
import Shop from "./pages/Shop.jsx";

import useGetCurrentUser from "./hooks/useGetCurrentUser.js";
import useGetCity from "./hooks/useGetCity.js";
import useGetMyShop from "./hooks/useGetMyShop.js";
import useGetItemByCity from "./hooks/useGetItemByCity.js";
import useGetMyOrders from "./hooks/useGetMyOrders.js";
import useUpdateLocation from "./hooks/useUpdateLocation.js";

import { setSocket } from "./redux/userSlice.js";

/*
This component is mounted only after the user logs in.

Therefore, these hooks will run after userData becomes available instead of
running once before authentication is completed.
*/
const AuthenticatedAppEffects = () => {
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.user);

  useGetCity();
  useGetMyShop();
  useGetItemByCity();
  useGetMyOrders();
  useUpdateLocation();

  /*
  useGetShopByCity() has intentionally been removed because UserDashboard
  now fetches every shop from:

  GET /api/shop/all
  */

  useEffect(() => {
    if (!userData?._id) return undefined;

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    if (!backendUrl) {
      console.error(
        "VITE_BACKEND_URL is missing from frontend environment variables."
      );

      return undefined;
    }

    const socketInstance = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    dispatch(setSocket(socketInstance));

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);

      socketInstance.emit("identity", {
        userId: userData._id,
      });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return () => {
      socketInstance.off("connect");
      socketInstance.off("connect_error");
      socketInstance.disconnect();

      dispatch(setSocket(null));
    };
  }, [dispatch, userData?._id]);

  return null;
};

function App() {
  const { loading } = useGetCurrentUser();

  const { userData } = useSelector((state) => state.user);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-bgColor">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-primaryColor rounded-full animate-spin" />

          <p className="text-gray-600 font-medium">
            Loading BiteNow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      {userData && <AuthenticatedAppEffects />}

      <Routes>
        <Route
          path="/"
          element={
            userData ? (
              <Home />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/signin"
          element={
            !userData ? (
              <SignIn />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/signup"
          element={
            !userData ? (
              <SignUp />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/forgot-password"
          element={
            !userData ? (
              <ForgotPassword />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/create-edit-shop"
          element={
            userData ? (
              <CreateEditShop />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/add-item"
          element={
            userData ? (
              <AddItem />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/edit-item/:itemId"
          element={
            userData ? (
              <EditItem />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/cart"
          element={
            userData ? (
              <CartPage />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/checkout"
          element={
            userData ? (
              <CheckOut />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/order-placed"
          element={
            userData ? (
              <OrderPlaced />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/my-orders"
          element={
            userData ? (
              <MyOrders />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/track-order/:orderId"
          element={
            userData ? (
              <TrackOrderPage />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route
          path="/shop/:shopId"
          element={
            userData ? (
              <Shop />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        {/* Invalid routes */}
        <Route
          path="*"
          element={
            <Navigate
              to={userData ? "/" : "/signin"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;