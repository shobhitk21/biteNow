import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  FaCircleChevronLeft,
  FaCircleChevronRight,
} from "react-icons/fa6";

import Nav from "./Nav";
import CategoryCard from "./CategoryCard";
import FoodCard from "./FoodCard";

import { categories } from "../category.js";

import {
  setAllItems,
  setAllShops,
} from "../redux/userSlice.js";

const getArrayFromResponse = (data, propertyName) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[propertyName])) {
    return data[propertyName];
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const categoryScrollRef = useRef(null);
  const shopScrollRef = useRef(null);

  const userState = useSelector((state) => state.user);

  const allShops = Array.isArray(userState.allShops)
    ? userState.allShops
    : [];

  const allItems = Array.isArray(userState.allItems)
    ? userState.allItems
    : [];

  const searchItems = Array.isArray(userState.searchItems)
    ? userState.searchItems
    : [];

  const [filteredItems, setFilteredItems] = useState([]);

  const [shopsLoading, setShopsLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [shopsError, setShopsError] = useState("");
  const [itemsError, setItemsError] = useState("");

  const [showLeftCategoryButton, setShowLeftCategoryButton] =
    useState(false);

  const [showRightCategoryButton, setShowRightCategoryButton] =
    useState(false);

  const [showLeftShopButton, setShowLeftShopButton] =
    useState(false);

  const [showRightShopButton, setShowRightShopButton] =
    useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchAllShops = useCallback(
    async (signal) => {
      try {
        setShopsLoading(true);
        setShopsError("");

        if (!backendUrl) {
          throw new Error("VITE_BACKEND_URL is missing.");
        }

        const { data } = await axios.get(
          `${backendUrl}/api/shop/all`,
          {
            withCredentials: true,
            signal,
          }
        );

        const shops = getArrayFromResponse(data, "shops");

        dispatch(setAllShops(shops));
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error("Get all shops error:", error);

        dispatch(setAllShops([]));

        setShopsError(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load shops."
        );
      } finally {
        if (!signal?.aborted) {
          setShopsLoading(false);
        }
      }
    },
    [backendUrl, dispatch]
  );

  const fetchAllItems = useCallback(
    async (signal) => {
      try {
        setItemsLoading(true);
        setItemsError("");

        if (!backendUrl) {
          throw new Error("VITE_BACKEND_URL is missing.");
        }

        const { data } = await axios.get(
          `${backendUrl}/api/item/all`,
          {
            withCredentials: true,
            signal,
          }
        );

        const items = getArrayFromResponse(data, "items");

        dispatch(setAllItems(items));
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error("Get all food items error:", error);

        dispatch(setAllItems([]));

        setItemsError(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load food items."
        );
      } finally {
        if (!signal?.aborted) {
          setItemsLoading(false);
        }
      }
    },
    [backendUrl, dispatch]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchAllShops(controller.signal);
    fetchAllItems(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchAllShops, fetchAllItems]);

  useEffect(() => {
    setFilteredItems(allItems);
  }, [allItems]);

  const retryShops = () => {
    fetchAllShops();
  };

  const retryItems = () => {
    fetchAllItems();
  };

  const handleFilterByCategory = (category) => {
    if (category === "All") {
      setFilteredItems(allItems);
      return;
    }

    const selectedCategory = String(category)
      .trim()
      .toLowerCase();

    const filteredList = allItems.filter((item) => {
      const itemCategory = String(item?.category || "")
        .trim()
        .toLowerCase();

      return itemCategory === selectedCategory;
    });

    setFilteredItems(filteredList);
  };

  const updateScrollButtons = (
    scrollReference,
    setShowLeft,
    setShowRight
  ) => {
    const element = scrollReference.current;

    if (!element) {
      setShowLeft(false);
      setShowRight(false);
      return;
    }

    const maximumScrollLeft =
      element.scrollWidth - element.clientWidth;

    setShowLeft(element.scrollLeft > 2);

    setShowRight(
      maximumScrollLeft > 2 &&
      element.scrollLeft < maximumScrollLeft - 2
    );
  };

  const scrollHandler = (scrollReference, direction) => {
    const element = scrollReference.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left: direction === "left" ? -250 : 250,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const categoryElement = categoryScrollRef.current;

    if (!categoryElement) {
      return undefined;
    }

    const updateCategoryButtons = () => {
      updateScrollButtons(
        categoryScrollRef,
        setShowLeftCategoryButton,
        setShowRightCategoryButton
      );
    };

    updateCategoryButtons();

    categoryElement.addEventListener(
      "scroll",
      updateCategoryButtons
    );

    window.addEventListener(
      "resize",
      updateCategoryButtons
    );

    return () => {
      categoryElement.removeEventListener(
        "scroll",
        updateCategoryButtons
      );

      window.removeEventListener(
        "resize",
        updateCategoryButtons
      );
    };
  }, []);

  useEffect(() => {
    const shopElement = shopScrollRef.current;

    if (!shopElement) {
      return undefined;
    }

    const updateShopButtons = () => {
      updateScrollButtons(
        shopScrollRef,
        setShowLeftShopButton,
        setShowRightShopButton
      );
    };

    const frameId = requestAnimationFrame(
      updateShopButtons
    );

    shopElement.addEventListener(
      "scroll",
      updateShopButtons
    );

    window.addEventListener(
      "resize",
      updateShopButtons
    );

    return () => {
      cancelAnimationFrame(frameId);

      shopElement.removeEventListener(
        "scroll",
        updateShopButtons
      );

      window.removeEventListener(
        "resize",
        updateShopButtons
      );
    };
  }, [allShops.length, shopsLoading]);

  return (
    <div className="w-full min-h-screen bg-bgColor flex flex-col items-center overflow-y-auto">
      <Nav />

      {/* Search Results */}
      {searchItems.length > 0 && (
        <section className="w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4">
          <h1 className="text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2">
            Search Results
          </h1>

          <div className="w-full flex flex-wrap gap-6 justify-center">
            {searchItems.map((item, index) => (
              <FoodCard
                key={item?._id || `search-item-${index}`}
                data={item}
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
          {showLeftCategoryButton && (
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() =>
                scrollHandler(categoryScrollRef, "left")
              }
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronLeft />
            </button>
          )}

          <div
            ref={categoryScrollRef}
            className="w-full flex overflow-x-auto gap-4 pb-2"
          >
            {categories.map((category, index) => (
              <CategoryCard
                key={
                  category?.category ||
                  `category-${index}`
                }
                name={category?.category}
                image={category?.image}
                onClick={() =>
                  handleFilterByCategory(
                    category?.category
                  )
                }
              />
            ))}
          </div>

          {showRightCategoryButton && (
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() =>
                scrollHandler(categoryScrollRef, "right")
              }
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronRight />
            </button>
          )}
        </div>
      </section>

      {/* All Shops */}
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
            <div className="w-full min-h-32 flex flex-col items-center justify-center gap-3">
              <p className="text-red-500 text-center font-medium">
                {shopsError}
              </p>

              <button
                type="button"
                onClick={retryShops}
                className="bg-primaryColor text-white px-5 py-2 rounded-lg hover:bg-hoverColor"
              >
                Try Again
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
              {allShops.map((shop, index) => (
                <CategoryCard
                  key={shop?._id || `shop-${index}`}
                  name={shop?.name || "Shop"}
                  image={shop?.image}
                  onClick={() => {
                    if (shop?._id) {
                      navigate(`/shop/${shop._id}`);
                    }
                  }}
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

      {/* All Suggested Food Items */}
      <section className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Suggested Food Items
        </h1>

        {itemsLoading ? (
          <div className="w-full h-32 flex items-center justify-center">
            <p className="text-gray-500 text-xl font-semibold">
              Loading food items...
            </p>
          </div>
        ) : itemsError ? (
          <div className="w-full min-h-32 flex flex-col items-center justify-center gap-3">
            <p className="text-red-500 text-center font-medium">
              {itemsError}
            </p>

            <button
              type="button"
              onClick={retryItems}
              className="bg-primaryColor text-white px-5 py-2 rounded-lg hover:bg-hoverColor"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="w-full h-32 flex items-center justify-center">
            <p className="text-gray-500 text-lg font-medium">
              No food items are available.
            </p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center pb-4">
            {filteredItems.map((item, index) => (
              <FoodCard
                key={
                  item?._id ||
                  `food-item-${index}`
                }
                data={item}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserDashboard;