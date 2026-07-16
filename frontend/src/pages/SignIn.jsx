import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";

import { setUserData } from "../redux/userSlice";

const DEMO_EMAIL = "test@gmail.com";
const DEMO_PASSWORD = "12345678";

const SignIn = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [showPassword, setShowPassword] = useState(false);

    // Dummy credentials are entered by default
    const [email, setEmail] = useState(DEMO_EMAIL);
    const [password, setPassword] = useState(DEMO_PASSWORD);

    const [loading, setLoading] = useState(false);

    const handleSignIn = async (event) => {
        event.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/signin`,
                {
                    email: email.trim(),
                    password,
                },
                {
                    withCredentials: true,
                }
            );

            dispatch(setUserData(data.user));

            toast.success(data.message || "Signed in successfully.");

            // Change this route if your dashboard route is different
            navigate("/");
        } catch (error) {
            console.error("Sign-in error:", error);

            toast.error(
                error.response?.data?.message ||
                "Unable to sign in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const fillDemoCredentials = () => {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-bgColor">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md px-8 py-6 border border-borderColor">
                <h1 className="text-3xl font-bold mb-2 text-primaryColor">
                    BiteNow
                </h1>

                <p className="text-gray-500 mb-5 text-sm">
                    Sign in to continue ordering delicious food
                </p>

                {/* Demo account information */}
                <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="font-semibold text-gray-800 text-sm mb-1">
                        Demo credentials
                    </p>

                    <p className="text-sm text-gray-600">
                        Email: <span className="font-medium">{DEMO_EMAIL}</span>
                    </p>

                    <p className="text-sm text-gray-600">
                        Password: <span className="font-medium">{DEMO_PASSWORD}</span>
                    </p>

                    <button
                        type="button"
                        onClick={fillDemoCredentials}
                        className="mt-2 text-sm font-medium text-primaryColor hover:underline"
                    >
                        Fill demo credentials
                    </button>
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
                            autoComplete="email"
                            className="w-full border-2 border-borderColor rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
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
                                autoComplete="current-password"
                                className="w-full border-2 border-borderColor rounded-lg px-3 py-2 pr-11 focus:outline-none focus:border-orange-500"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />

                            <button
                                type="button"
                                aria-label={
                                    showPassword ? "Hide password" : "Show password"
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                onClick={() =>
                                    setShowPassword((previousValue) => !previousValue)
                                }
                            >
                                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="w-full text-right mb-4 cursor-pointer font-medium text-primaryColor"
                        onClick={() => navigate("/forgot-password")}
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
                        onClick={() => navigate("/signup")}
                        className="cursor-pointer text-primaryColor"
                    >
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignIn;