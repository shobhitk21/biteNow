import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaCircleChevronLeft,
  FaCircleChevronRight,
} from "react-icons/fa6";

import Nav from "./Nav";
import FoodCard from "./FoodCard";
import CategoryCard from "./CategoryCard";
import { categories } from "../category.js";

/*
 Add this in your frontend .env file:

 VITE_SERVER_URL=http://localhost:8000

 For deployed frontend, use your deployed backend URL:

 VITE_SERVER_URL=https://your-backend.onrender.com
*/
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const UserDashboard = () => {
  const navigate = useNavigate();

  const cateScrollRef = useRef(null);
  const shopScrollRef = useRef(null);
  const itemsGridRef = useRef(null);

  const {
    currentCity,
    itemsInMyCity = [],
    searchItems = [],
  } = useSelector((state) => state.user);

  const [allShops, setAllShops] = useState([]);
  const [updatedItemsList, setUpdatedItemsList] = useState([]);

  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState("");

  const [showLeftCateButton, setShowLeftCateButton] = useState(false);
  const [showRightCateButton, setShowRightCateButton] = useState(false);

  const [showLeftShopButton, setShowLeftShopButton] = useState(false);
  const [showRightShopButton, setShowRightShopButton] = useState(false);

  /*
   Fetch every shop created by admin.

   This request runs whenever UserDashboard is opened, including immediately
   after login. Therefore, a hard refresh is no longer required.
  */
  const getAllShops = useCallback(async (signal) => {
    try {
      setShopsLoading(true);
      setShopsError("");

      if (!SERVER_URL) {
        throw new Error(
          "VITE_SERVER_URL is missing from the frontend environment variables."
        );
      }

      const response = await axios.get(`${SERVER_URL}/api/shop/all`, {
        withCredentials: true,
        signal,
      });

      /*
       Supports any of these backend responses:

       [shop1, shop2]

       { shops: [shop1, shop2] }

       { data: [shop1, shop2] }
      */
      const shops =
        response.data?.shops ??
        response.data?.data ??
        response.data ??
        [];

      setAllShops(Array.isArray(shops) ? shops : []);
    } catch (error) {
      if (
        error.name === "CanceledError" ||
        error.code === "ERR_CANCELED"
      ) {
        return;
      }

      console.error("Get all shops error:", error);

      setAllShops([]);
      setShopsError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load shops."
      );
    } finally {
      if (!signal?.aborted) {
        setShopsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getAllShops(controller.signal);

    return () => {
      controller.abort();
    };
  }, [getAllShops]);

  useEffect(() => {
    setUpdatedItemsList(
      Array.isArray(itemsInMyCity) ? itemsInMyCity : []
    );
  }, [itemsInMyCity]);

  const handleFilterByCategory = (category) => {
    if (category === "All") {
      setUpdatedItemsList(itemsInMyCity);
      return;
    }

    const filteredItems = itemsInMyCity.filter(
      (item) =>
        item.category?.toLowerCase() === category.toLowerCase()
    );

    setUpdatedItemsList(filteredItems);
  };

  const updateScrollButtons = (
    ref,
    setShowLeftButton,
    setShowRightButton
  ) => {
    const element = ref.current;

    if (!element) {
      setShowLeftButton(false);
      setShowRightButton(false);
      return;
    }

    const maxScrollLeft =
      element.scrollWidth - element.clientWidth;

    setShowLeftButton(element.scrollLeft > 2);
    setShowRightButton(
      maxScrollLeft > 2 &&
      element.scrollLeft < maxScrollLeft - 2
    );
  };

  const scrollHandler = (ref, direction) => {
    const element = ref.current;

    if (!element) return;

    element.scrollBy({
      left: direction === "left" ? -250 : 250,
      behavior: "smooth",
    });
  };

  /*
   Update category scroll arrows.
  */
  useEffect(() => {
    const element = cateScrollRef.current;

    if (!element) return undefined;

    const updateCategoryButtons = () => {
      updateScrollButtons(
        cateScrollRef,
        setShowLeftCateButton,
        setShowRightCateButton
      );
    };

    updateCategoryButtons();

    element.addEventListener("scroll", updateCategoryButtons);
    window.addEventListener("resize", updateCategoryButtons);

    return () => {
      element.removeEventListener(
        "scroll",
        updateCategoryButtons
      );

      window.removeEventListener(
        "resize",
        updateCategoryButtons
      );
    };
  }, []);

  /*
   Update shop scroll arrows again after the asynchronous shop request
   finishes.
  */
  useEffect(() => {
    const element = shopScrollRef.current;

    if (!element) return undefined;

    const updateShopButtons = () => {
      updateScrollButtons(
        shopScrollRef,
        setShowLeftShopButton,
        setShowRightShopButton
      );
    };

    const animationFrame = requestAnimationFrame(
      updateShopButtons
    );

    element.addEventListener("scroll", updateShopButtons);
    window.addEventListener("resize", updateShopButtons);

    return () => {
      cancelAnimationFrame(animationFrame);

      element.removeEventListener("scroll", updateShopButtons);
      window.removeEventListener("resize", updateShopButtons);
    };
  }, [allShops]);

  return (
    <div className="w-full min-h-screen bg-bgColor flex flex-col items-center overflow-y-auto">
      <Nav />

      {/* Search results */}
      {searchItems.length > 0 && (
        <section className="w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4">
          <h1 className="text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2">
            Search Results
          </h1>

          <div className="w-full flex flex-wrap gap-6 justify-center">
            {searchItems.map((item) => (
              <FoodCard
                data={item}
                key={item._id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Inspiration for your first order
        </h1>

        <div className="w-full relative">
          {showLeftCateButton && (
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() =>
                scrollHandler(cateScrollRef, "left")
              }
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronLeft />
            </button>
          )}

          <div
            ref={cateScrollRef}
            className="w-full flex overflow-x-auto gap-4 pb-2"
          >
            {categories.map((category) => (
              <CategoryCard
                key={category.category}
                name={category.category}
                image={category.image}
                onClick={() =>
                  handleFilterByCategory(category.category)
                }
              />
            ))}
          </div>

          {showRightCateButton && (
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() =>
                scrollHandler(cateScrollRef, "right")
              }
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronRight />
            </button>
          )}
        </div>
      </section>

      {/* All shops */}
      <section className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Best Shops in Your Location
        </h1>

        <div className="w-full relative">
          {showLeftShopButton && (
            <button
              type="button"
              aria-label="Scroll shops left"
              onClick={() =>
                scrollHandler(shopScrollRef, "left")
              }
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronLeft />
            </button>
          )}

          {shopsLoading ? (
            <div className="w-full h-32 flex items-center justify-center">
              <p className="text-gray-500 text-xl font-semibold">
                Loading shops...
              </p>
            </div>
          ) : shopsError ? (
            <div className="w-full min-h-32 flex flex-col gap-3 items-center justify-center">
              <p className="text-red-500 text-center font-medium">
                {shopsError}
              </p>

              <button
                type="button"
                onClick={() => getAllShops()}
                className="bg-primaryColor text-white px-5 py-2 rounded-lg hover:bg-hoverColor"
              >
                Try again
              </button>
            </div>
          ) : allShops.length === 0 ? (
            <div className="w-full h-32 flex items-center justify-center">
              <p className="text-gray-500 text-xl font-semibold sm:text-2xl">
                No shops are available.
              </p>
            </div>
          ) : (
            <div
              ref={shopScrollRef}
              className="w-full flex overflow-x-auto gap-4 pb-2"
            >
              {allShops.map((shop) => (
                <CategoryCard
                  key={shop._id}
                  name={shop.name}
                  image={shop.image}
                  onClick={() =>
                    navigate(`/shop/${shop._id}`)
                  }
                />
              ))}
            </div>
          )}

          {showRightShopButton && (
            <button
              type="button"
              aria-label="Scroll shops right"
              onClick={() =>
                scrollHandler(shopScrollRef, "right")
              }
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronRight />
            </button>
          )}
        </div>
      </section>

      {/* Items grid */}
      <section className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        {currentCity == null ? (
          <div className="w-full h-[30vh] flex items-center justify-center">
            <h1 className="text-gray-500 text-xl font-semibold sm:text-2xl">
              Turn on your location to see nearby food items...
            </h1>
          </div>
        ) : (
          <h1 className="text-gray-800 text-2xl sm:text-3xl">
            Suggested Food Items
          </h1>
        )}

        <div
          ref={itemsGridRef}
          className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center pb-4"
        >
          {updatedItemsList.map((item) => (
            <FoodCard
              data={item}
              key={item._id}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;