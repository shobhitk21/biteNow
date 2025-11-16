import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import { categories } from '../category.js'
import CategoryCard from './CategoryCard.jsx'
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";
import { useDispatch, useSelector } from 'react-redux';
import FoodCard from './FoodCard';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const cateScrollRef = useRef();
  const shopScrollRef = useRef();
  const itemsGridRef = useRef();
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { currentCity, shopsInMyCity, itemsInMyCity, searchItems } = useSelector(state => state.user);

  const [showLeftCateButton, setShowLeftCateButton] = useState(false);
  const [showRightCateButton, setShowRightCateButton] = useState(false);

  const [showLeftShopButton, setShowLeftShopButton] = useState(false);
  const [showRightShopButton, setShowRightShopButton] = useState(false);

  const [updatedItemsList, setUpdatedItemsList] = useState([]);

  const handleFilterByCategory = (category) => {
    if (category === "All") {
      setUpdatedItemsList(itemsInMyCity);
    } else {
      const filteredList = itemsInMyCity?.filter(i => i.category === category);
      setUpdatedItemsList(filteredList);
    }
  };

  const updateButton = (ref, setLeftButton, setRightButton) => {
    const element = ref.current;
    if (element) {
      setLeftButton(element.scrollLeft > 0);
      setRightButton(element.scrollWidth > element.clientWidth + element.scrollLeft);
    }
  };

  const scrollHandler = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    setUpdatedItemsList(itemsInMyCity);
  }, [itemsInMyCity]);

  useEffect(() => {
    const cateEl = cateScrollRef.current;
    const shopEl = shopScrollRef.current;

    const handleCateScroll = () =>
      updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton);

    const handleShopScroll = () =>
      updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton);

    if (cateEl) {
      updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton);
      cateEl.addEventListener("scroll", handleCateScroll);
    }

    if (shopEl) {
      updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton);
      shopEl.addEventListener("scroll", handleShopScroll);
    }

    return () => {
      if (cateEl) cateEl.removeEventListener("scroll", handleCateScroll);
      if (shopEl) shopEl.removeEventListener("scroll", handleShopScroll);
    };
  }, [shopsInMyCity]);

  return (
    <div className="w-full min-h-screen bg-bgColor flex flex-col items-center overflow-y-auto">
      <Nav />

      {/* Search Results */}
      {searchItems && searchItems.length > 0 && (
        <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4">
          <h1 className="text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2">
            Search Results
          </h1>

          <div className="w-full h-auto flex flex-wrap gap-6 justify-center">
            {searchItems.map((item) => (
              <FoodCard data={item} key={item._id} />
            ))}
          </div>
        </div>
      )}

      {/* Category Horizontal List */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">Inspiration for your first order</h1>

        <div className="w-full relative">
          {showLeftCateButton && (
            <button
              onClick={() => scrollHandler(cateScrollRef, "left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronLeft />
            </button>
          )}

          <div
            ref={cateScrollRef}
            className="w-full flex overflow-x-auto gap-4 pb-2"
          >
            {categories.map((cate, index) => (
              <CategoryCard
                name={cate.category}
                image={cate.image}
                key={index}
                onClick={() => handleFilterByCategory(cate.category)}
              />
            ))}
          </div>

          {showRightCateButton && (
            <button
              onClick={() => scrollHandler(cateScrollRef, "right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
            >
              <FaCircleChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Shops Horizontal List */}
      {currentCity && (
        <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
          <h1 className="text-gray-800 text-2xl sm:text-3xl">Best Shop in {currentCity}</h1>

          <div className="w-full relative">
            {showLeftShopButton && (
              <button
                onClick={() => scrollHandler(shopScrollRef, "left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
              >
                <FaCircleChevronLeft />
              </button>
            )}

            {shopsInMyCity?.length === 0 && (
              <div className="w-full h-32 flex items-center justify-center">
                <h1 className="text-gray-500 text-xl font-semibold sm:text-2xl">
                  No shops available in your city...
                </h1>
              </div>
            )}

            <div
              ref={shopScrollRef}
              className="w-full flex overflow-x-auto gap-4 pb-2"
            >
              {shopsInMyCity?.map((shop, index) => (
                <CategoryCard
                  name={shop.name}
                  image={shop.image}
                  key={index}
                  onClick={() => navigate(`shop/${shop._id}`)}
                />
              ))}
            </div>

            {showRightShopButton && (
              <button
                onClick={() => scrollHandler(shopScrollRef, "right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10"
              >
                <FaCircleChevronRight />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        {currentCity == null ? (
          <div className="w-full h-[30vh] flex items-center justify-center">
            <h1 className="text-gray-500 text-xl font-semibold sm:text-2xl">
              Turn on your location...
            </h1>
          </div>
        ) : shopsInMyCity?.length === 0 ? null : (
          <h1 className="text-gray-800 text-2xl sm:text-3xl">Suggested Food Items</h1>
        )}

        <div
          ref={itemsGridRef}
          className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center pb-4"
        >
          {updatedItemsList?.map((item, index) => (
            <FoodCard data={item} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
