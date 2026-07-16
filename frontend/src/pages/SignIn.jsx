import React, { useState } from "react";
import {
    FaRegEye,
    FaRegEyeSlash,
    FaUser,
    FaStore,
    FaMotorcycle,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import axios from "axios";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

import { setUserData } from "../redux/userSlice.js";

const DEMO_ACCOUNTS = {
    user: {
        role: "User",
        email: "test@gmail.com",
        password: "12345678",
    },

    shopOwner: {
        role: "Shop Owner",
        email: "owner@gmail.com",
        password: "123456",
    },

    deliveryBoy: {
        role: "Delivery Boy",
        email: "delivery@gmail.com",
        password: "123456",
    },
};

const SignIn = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [showPassword, setShowPassword] = useState(false);

    // User credentials will be selected by default
    const [selectedDemoRole, setSelectedDemoRole] = useState("user");

    const [email, setEmail] = useState(
        DEMO_ACCOUNTS.user.email
    );

    const [password, setPassword] = useState(
        DEMO_ACCOUNTS.user.password
    );

    const [loading, setLoading] = useState(false);

    const fillDemoCredentials = (accountType) => {
        const selectedAccount = DEMO_ACCOUNTS[accountType];

        if (!selectedAccount) {
            return;
        }

        setSelectedDemoRole(accountType);
        setEmail(selectedAccount.email);
        setPassword(selectedAccount.password);
    };

    const handleSignIn = async (event) => {
        event.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail || !password) {
            toast.error("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const backendUrl = import.meta.env.VITE_BACKEND_URL;

            if (!backendUrl) {
                throw new Error(
                    "VITE_BACKEND_URL is missing from the environment variables."
                );
            }

            const { data } = await axios.post(
                `${backendUrl}/api/auth/signin`,
                {
                    email: trimmedEmail,
                    password,
                },
                {
                    withCredentials: true,
                }
            );

            if (!data?.user) {
                throw new Error(
                    "User information was not returned by the server."
                );
            }

            dispatch(setUserData(data.user));

            toast.success(
                data.message || "Signed in successfully."
            );

            navigate("/", {
                replace: true,
            });
        } catch (error) {
            console.error("Sign-in error:", error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to sign in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-bgColor">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md px-6 sm:px-8 py-6 border border-borderColor">
                <h1 className="text-3xl font-bold mb-2 text-primaryColor">
                    BiteNow
                </h1>

                <p className="text-gray-500 mb-5 text-sm">
                    Sign in to continue ordering delicious food
                </p>

                {/* Demo account selection */}
                <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-3">
                    <p className="font-semibold text-gray-800 text-sm mb-3">
                        Select a demo account
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => fillDemoCredentials("user")}
                            className={`flex sm:flex-col items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition ${selectedDemoRole === "user"
                                    ? "bg-primaryColor text-white border-primaryColor"
                                    : "bg-white text-gray-700 border-orange-200 hover:border-primaryColor"
                                }`}
                        >
                            <FaUser />
                            User
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                                fillDemoCredentials("shopOwner")
                            }
                            className={`flex sm:flex-col items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition ${selectedDemoRole === "shopOwner"
                                    ? "bg-primaryColor text-white border-primaryColor"
                                    : "bg-white text-gray-700 border-orange-200 hover:border-primaryColor"
                                }`}
                        >
                            <FaStore />
                            Shop Owner
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                                fillDemoCredentials("deliveryBoy")
                            }
                            className={`flex sm:flex-col items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition ${selectedDemoRole === "deliveryBoy"
                                    ? "bg-primaryColor text-white border-primaryColor"
                                    : "bg-white text-gray-700 border-orange-200 hover:border-primaryColor"
                                }`}
                        >
                            <FaMotorcycle />
                            Delivery Boy
                        </button>
                    </div>

                    <div className="mt-3 rounded-lg bg-white border border-orange-100 p-3">
                        <p className="text-sm text-gray-600">
                            Role:{" "}
                            <span className="font-semibold text-gray-800">
                                {DEMO_ACCOUNTS[selectedDemoRole].role}
                            </span>
                        </p>

                        <p className="text-sm text-gray-600 break-all">
                            Email:{" "}
                            <span className="font-medium">
                                {DEMO_ACCOUNTS[selectedDemoRole].email}
                            </span>
                        </p>

                        <p className="text-sm text-gray-600">
                            Password:{" "}
                            <span className="font-medium">
                                {DEMO_ACCOUNTS[selectedDemoRole].password}
                            </span>
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSignIn}>
                    <div className="mb-4">
                        <label
                            htmlFor="email"
                            className="block text-gray-700 font-medium mb-1"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            disabled={loading}
                            autoComplete="email"
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setSelectedDemoRole("");
                            }}
                            className="w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="password"
                            className="block text-gray-700 font-medium mb-1"
                        >
                            Password
                        </label>

                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                disabled={loading}
                                autoComplete="current-password"
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    setSelectedDemoRole("");
                                }}
                                className="w-full border-2 border-borderColor rounded-lg px-3 py-2 pr-11 focus:outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                                required
                            />

                            <button
                                type="button"
                                disabled={loading}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                onClick={() =>
                                    setShowPassword(
                                        (previousValue) => !previousValue
                                    )
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 disabled:cursor-not-allowed"
                            >
                                {showPassword ? (
                                    <FaRegEyeSlash />
                                ) : (
                                    <FaRegEye />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => navigate("/forgot-password")}
                        className="block ml-auto text-right mb-4 cursor-pointer font-medium text-primaryColor disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Forgot Password?
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full min-h-10 cursor-pointer font-semibold py-2 rounded-lg bg-primaryColor text-white hover:bg-hoverColor transition duration-200 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center"
                    >
                        {loading ? (
                            <ClipLoader size={20} color="#ffffff" />
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <p className="text-center mt-5">
                    Want to create an account?{" "}
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => navigate("/signup")}
                        className="cursor-pointer text-primaryColor disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignIn;