import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

import { ClipLoader } from "react-spinners";

import Nav from "./Nav";
import DeliveryBoyTracking from "./DeliveryBoyTracking";

const DeliveryBoy = () => {
  const navigate = useNavigate();

  const { userData, socket } = useSelector(
    (state) => state.user
  );

  const [availableAssignments, setAvailableAssignments] =
    useState([]);

  const [currentOrder, setCurrentOrder] = useState(null);

  const [showOtpBox, setShowOtpBox] = useState(false);
  const [dummyOtp, setDummyOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");

  const [deliveryBoyLocation, setDeliveryBoyLocation] =
    useState(null);

  const [todayDeliveries, setTodayDeliveries] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const ratePerDelivery = 50;

  const totalEarning = useMemo(() => {
    return todayDeliveries.reduce((total, delivery) => {
      const deliveryCount = Number(delivery?.count) || 0;

      return total + deliveryCount * ratePerDelivery;
    }, 0);
  }, [todayDeliveries]);

  const showApiError = (error, fallbackMessage) => {
    console.error(error);

    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      fallbackMessage
    );
  };

  const getAssignments = useCallback(async () => {
    if (
      !userData?._id ||
      userData.role !== "deliveryBoy" ||
      !backendUrl
    ) {
      return;
    }

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/order/get-assignments`,
        {
          withCredentials: true,
        }
      );

      setAvailableAssignments(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      showApiError(
        error,
        "Unable to load available assignments"
      );
    }
  }, [backendUrl, userData?._id, userData?.role]);

  const getCurrentOrder = useCallback(async () => {
    if (
      !userData?._id ||
      userData.role !== "deliveryBoy" ||
      !backendUrl
    ) {
      return;
    }

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/order/get-current-order`,
        {
          withCredentials: true,
        }
      );

      setCurrentOrder(data || null);
    } catch (error) {
      if (
        error?.response?.status === 400 ||
        error?.response?.status === 404
      ) {
        setCurrentOrder(null);
        return;
      }

      showApiError(error, "Unable to load current order");
    }
  }, [backendUrl, userData?._id, userData?.role]);

  const getTodayDeliveries = useCallback(async () => {
    if (
      !userData?._id ||
      userData.role !== "deliveryBoy" ||
      !backendUrl
    ) {
      return;
    }

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/order/get-today-deliveries`,
        {
          withCredentials: true,
        }
      );

      setTodayDeliveries(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      showApiError(
        error,
        "Unable to load today's deliveries"
      );
    }
  }, [backendUrl, userData?._id, userData?.role]);

  const refreshDeliveryData = useCallback(async () => {
    try {
      setInitialLoading(true);

      await Promise.all([
        getAssignments(),
        getCurrentOrder(),
        getTodayDeliveries(),
      ]);
    } catch (error) {
      console.error("Refresh delivery data error:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [
    getAssignments,
    getCurrentOrder,
    getTodayDeliveries,
  ]);

  useEffect(() => {
    if (
      !userData?._id ||
      userData.role !== "deliveryBoy"
    ) {
      return;
    }

    refreshDeliveryData();
  }, [
    refreshDeliveryData,
    userData?._id,
    userData?.role,
  ]);

  /*
   * Receive new delivery assignments through Socket.IO.
   */
  useEffect(() => {
    if (
      !socket ||
      !userData?._id ||
      userData.role !== "deliveryBoy"
    ) {
      return undefined;
    }

    const handleNewAssignment = (assignment) => {
      if (
        String(assignment?.sentTo) !==
        String(userData._id)
      ) {
        return;
      }

      setAvailableAssignments((previousAssignments) => {
        const assignments = Array.isArray(
          previousAssignments
        )
          ? previousAssignments
          : [];

        const assignmentAlreadyExists = assignments.some(
          (existingAssignment) =>
            String(existingAssignment?.assignmentId) ===
            String(assignment?.assignmentId)
        );

        if (assignmentAlreadyExists) {
          return assignments;
        }

        return [...assignments, assignment];
      });
    };

    socket.on("newAssignment", handleNewAssignment);

    return () => {
      socket.off("newAssignment", handleNewAssignment);
    };
  }, [socket, userData?._id, userData?.role]);

  /*
   * Track the delivery partner's live location.
   */
  useEffect(() => {
    if (
      !socket ||
      !userData?._id ||
      userData.role !== "deliveryBoy"
    ) {
      return undefined;
    }

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported");
      return undefined;
    }

    const handleLocationSuccess = (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setDeliveryBoyLocation({
        lat: latitude,
        lon: longitude,
      });

      socket.emit("updateLocation", {
        latitude,
        longitude,
        userId: userData._id,
      });
    };

    const handleLocationError = (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        console.warn("Location permission denied");
        return;
      }

      if (error.code === error.POSITION_UNAVAILABLE) {
        console.warn("Location is currently unavailable");
        return;
      }

      if (error.code === error.TIMEOUT) {
        console.warn("Location request timed out");
        return;
      }

      console.error("Geolocation error:", error);
    };

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, userData?._id, userData?.role]);

  const acceptOrder = async (assignmentId) => {
    if (!assignmentId || acceptingId) {
      return;
    }

    try {
      setAcceptingId(assignmentId);

      const { data } = await axios.post(
        `${backendUrl}/api/order/accept-order/${assignmentId}`,
        {},
        {
          withCredentials: true,
        }
      );

      toast.success(
        data?.message || "Order accepted successfully"
      );

      setAvailableAssignments((assignments) =>
        assignments.filter(
          (assignment) =>
            String(assignment?.assignmentId) !==
            String(assignmentId)
        )
      );

      await Promise.all([
        getCurrentOrder(),
        getAssignments(),
      ]);
    } catch (error) {
      showApiError(error, "Unable to accept order");
    } finally {
      setAcceptingId(null);
    }
  };

  /*
   * Generate and display the dummy OTP.
   */
  const generateDummyOtp = async () => {
    const orderId = currentOrder?.order?._id;
    const shopOrderId = currentOrder?.shopOrder?._id;

    if (!orderId || !shopOrderId) {
      toast.error("Current order information is incomplete");
      return;
    }

    try {
      setOtpLoading(true);

      const { data } = await axios.post(
        `${backendUrl}/api/order/send-delivery-otp`,
        {
          orderId,
          shopOrderId,
        },
        {
          withCredentials: true,
        }
      );

      const generatedOtp = String(
        data?.dummyOtp || ""
      );

      if (!generatedOtp) {
        throw new Error(
          "Dummy OTP was not returned by the backend"
        );
      }

      setDummyOtp(generatedOtp);
      setEnteredOtp("");
      setShowOtpBox(true);

      toast.success(
        data?.message ||
        "Dummy delivery OTP generated successfully"
      );
    } catch (error) {
      showApiError(
        error,
        "Unable to generate dummy delivery OTP"
      );
    } finally {
      setOtpLoading(false);
    }
  };

  /*
   * Verify OTP through the backend.
   * The backend performs the final verification and marks the order delivered.
   */
  const verifyDummyOtp = async () => {
    const orderId = currentOrder?.order?._id;
    const shopOrderId = currentOrder?.shopOrder?._id;
    const cleanOtp = enteredOtp.trim();

    if (!orderId || !shopOrderId) {
      toast.error("Current order information is incomplete");
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      setOtpLoading(true);

      const { data } = await axios.post(
        `${backendUrl}/api/order/verify-delivery-otp`,
        {
          orderId,
          shopOrderId,
          otp: cleanOtp,
        },
        {
          withCredentials: true,
        }
      );

      toast.success(
        data?.message || "Order delivered successfully"
      );

      /*
       * Immediately remove completed order from the UI.
       */
      setCurrentOrder(null);
      setShowOtpBox(false);
      setDummyOtp("");
      setEnteredOtp("");

      /*
       * Reload assignments, current order and today's earnings.
       * Do not use navigate("/") because you are already on the dashboard.
       */
      await refreshDeliveryData();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      showApiError(
        error,
        "Unable to verify dummy delivery OTP"
      );
    } finally {
      setOtpLoading(false);
    }
  };

  if (userData?.role !== "deliveryBoy") {
    return (
      <div className="w-screen min-h-screen flex flex-col items-center bg-bgColor">
        <Nav />

        <div className="mt-20 bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 font-medium">
            This page is available only for delivery partners.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen flex flex-col gap-5 items-center bg-bgColor overflow-y-auto pb-6">
      <Nav />

      <div className="w-full max-w-[800px] flex flex-col gap-5 items-center">
        {/* Delivery partner details */}
        <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center w-[90%] border border-orange-100 text-center gap-2">
          <h1 className="text-xl font-bold text-[#ff4d2d]">
            Welcome,{" "}
            {userData?.fullName || "Delivery Partner"}
          </h1>

          <p className="text-[#ff4d2d] text-sm">
            {deliveryBoyLocation ? (
              <>
                <span className="font-semibold">
                  Latitude:{" "}
                  {deliveryBoyLocation.lat.toFixed(5)}
                </span>

                <span className="font-semibold">
                  {" "}
                  | Longitude:{" "}
                  {deliveryBoyLocation.lon.toFixed(5)}
                </span>
              </>
            ) : (
              <span className="font-medium">
                Location permission is unavailable or disabled
              </span>
            )}
          </p>
        </div>

        {/* Today's delivery statistics */}
        <div className="bg-white rounded-2xl shadow-md p-5 w-[90%] border border-orange-100">
          <h2 className="text-lg mb-3 font-bold text-[#ff4d2d]">
            Today Deliveries
          </h2>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayDeliveries}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
              />

              <YAxis allowDecimals={false} />

              <Tooltip
                formatter={(value) => [value, "orders"]}
                labelFormatter={(label) => `${label}:00`}
              />

              <Bar dataKey="count" fill="#ff4d2d" />
            </BarChart>
          </ResponsiveContainer>

          {todayDeliveries.length === 0 && (
            <p className="text-center text-gray-400 text-sm">
              No deliveries made today
            </p>
          )}

          <div className="max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Today&apos;s Earning
            </h2>

            <span className="text-3xl font-bold text-green-600">
              ₹{totalEarning}
            </span>
          </div>
        </div>

        {initialLoading ? (
          <div className="w-[90%] bg-white p-8 rounded-2xl shadow-md flex justify-center">
            <ClipLoader size={30} color="#ff4d2d" />
          </div>
        ) : !currentOrder ? (
          /* Available assignments */
          <div className="bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100">
            <h2 className="text-lg font-bold mb-4">
              Available Orders
            </h2>

            <div className="space-y-4">
              {availableAssignments.length > 0 ? (
                availableAssignments.map((assignment) => (
                  <div
                    key={assignment?.assignmentId}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4 sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {assignment?.shopName || "Shop"}
                      </p>

                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">
                          Delivery Address:
                        </span>{" "}
                        {assignment?.deliveryAddress?.text ||
                          "Address unavailable"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {assignment?.items?.length || 0} items
                        {" | "}₹{assignment?.subtotal || 0}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        acceptingId === assignment?.assignmentId
                      }
                      onClick={() =>
                        acceptOrder(assignment?.assignmentId)
                      }
                      className="bg-primaryColor text-white px-4 py-2 rounded-lg text-sm hover:bg-hoverColor disabled:opacity-60"
                    >
                      {acceptingId ===
                        assignment?.assignmentId ? (
                        <ClipLoader
                          size={17}
                          color="#ffffff"
                        />
                      ) : (
                        "Accept"
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">
                  No available orders
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Current order */
          <div className="bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100">
            <h2 className="text-lg font-bold mb-4">
              Current Order
            </h2>

            <div className="border rounded-lg p-4">
              <p className="text-sm font-semibold">
                {currentOrder?.shopName || "Shop"}
              </p>

              <p className="text-sm text-gray-500">
                <span className="font-semibold">
                  Delivery Address:
                </span>{" "}
                {currentOrder?.deliveryAddress?.text ||
                  "Address unavailable"}
              </p>

              <p className="text-sm text-gray-500">
                {currentOrder?.shopOrder?.shopOrderItems
                  ?.length || 0}{" "}
                items | ₹
                {currentOrder?.shopOrder?.subtotal || 0}
              </p>

              <div className="mt-2">
                <h3 className="font-semibold">Items:</h3>

                <ul className="list-disc list-inside">
                  {currentOrder?.shopOrder?.shopOrderItems?.map(
                    (item, index) => (
                      <li
                        key={item?._id || index}
                        className="text-sm text-gray-600"
                      >
                        {item?.name || "Item"} x{" "}
                        {item?.quantity || 1}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            <DeliveryBoyTracking
              data={{
                deliveryBoyLocation:
                  deliveryBoyLocation || {
                    lat:
                      userData?.location?.coordinates?.[1] ??
                      0,
                    lon:
                      userData?.location?.coordinates?.[0] ??
                      0,
                  },

                customerLocation: {
                  lat:
                    currentOrder?.deliveryAddress?.latitude ??
                    0,
                  lon:
                    currentOrder?.deliveryAddress?.longitude ??
                    0,
                },
              }}
            />

            {!showOtpBox ? (
              <button
                type="button"
                disabled={otpLoading}
                onClick={generateDummyOtp}
                className="mt-4 w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-green-600 disabled:opacity-60"
              >
                {otpLoading ? (
                  <ClipLoader size={20} color="#ffffff" />
                ) : (
                  "Mark as Delivered"
                )}
              </button>
            ) : (
              <div className="mt-4 p-4 border border-orange-200 rounded-xl bg-orange-50">
                <h3 className="text-lg font-bold text-gray-800 text-center">
                  Confirm Delivery
                </h3>

                <p className="text-sm text-gray-600 text-center mt-1">
                  Enter the dummy OTP below to mark the order
                  as delivered.
                </p>

                {/* Visible dummy OTP */}
                <div className="mt-4 p-4 border-2 border-dashed border-orange-300 rounded-xl bg-white text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Dummy OTP
                  </p>

                  <p className="mt-2 text-3xl tracking-[8px] font-bold text-primaryColor">
                    {dummyOtp}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    This OTP is visible for demonstration only.
                  </p>
                </div>

                <label
                  htmlFor="deliveryOtp"
                  className="block mt-4 mb-2 text-sm font-semibold text-gray-700"
                >
                  Enter OTP
                </label>

                <input
                  id="deliveryOtp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={enteredOtp}
                  placeholder="Enter 6-digit OTP"
                  onChange={(event) =>
                    setEnteredOtp(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  className="w-full border-2 border-gray-200 px-3 py-3 rounded-lg text-center text-xl tracking-[7px] font-semibold focus:outline-none focus:border-primaryColor"
                />

                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={verifyDummyOtp}
                  className="mt-4 w-full bg-primaryColor text-white py-3 rounded-lg font-semibold hover:bg-hoverColor disabled:opacity-60"
                >
                  {otpLoading ? (
                    <ClipLoader
                      size={20}
                      color="#ffffff"
                    />
                  ) : (
                    "Verify OTP and Mark Delivered"
                  )}
                </button>

                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={() => {
                    setShowOtpBox(false);
                    setDummyOtp("");
                    setEnteredOtp("");
                  }}
                  className="mt-3 w-full text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryBoy;