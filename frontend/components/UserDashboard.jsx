import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import { categories } from '../src/category'
import CategoryCard from './CategoryCard'
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";
import { useSelector } from 'react-redux';
import FoodCard from './FoodCard';

const UserDashboard = () => {
  const cateScrollRef = useRef()
  const shopScrollRef = useRef()
  const { currentCity, shopsInMyCity, itemsInMyCity } = useSelector(state => state.user)
  const [showLeftCateButton, setShowLeftCateButton] = useState(true)
  const [showRightCateButton, setShowRightCateButton] = useState(false)
  const [showLeftShopButton, setShowLeftShopButton] = useState(false)
  const [showRightShopButton, setShowRightShopButton] = useState(false)



  const updateButton = (ref, setLeftButton, setRightButton) => {
    const element = ref.current
    if (element) {
      setLeftButton(element.scrollLeft > 0)
      setRightButton(element.scrollWidth > element.clientWidth + element.scrollLeft)
    }
  }

  const scrollHandler = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: 'smooth'
      })
    }
  }


  useEffect(() => {
    const cateEl = cateScrollRef?.current;
    const shopEl = shopScrollRef?.current;

    const handleCateScroll = () => updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton);
    const handleShopScroll = () => updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton);

    if (cateEl) {
      updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton);
      cateEl.addEventListener("scroll", handleCateScroll);
    }

    if (shopEl) {
      updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton);
      shopEl.addEventListener("scroll", handleShopScroll);
    }

    return () => {
      if (cateEl) cateEl?.removeEventListener("scroll", handleCateScroll);
      if (shopEl) shopEl?.removeEventListener("scroll", handleShopScroll);
    };
  }, [categories, shopsInMyCity]);



  return (
    <div className='w-full min-h-screen bg-bgColor flex flex-col items-center overflow-y-auto'>
      <Nav />
      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
        <h1 className='text-gray-800 text-2xl sm:text-3xl'>Inspiration for your first order</h1>
        <div className='w-full relative'>
          {
            showLeftCateButton && <button onClick={() => scrollHandler(cateScrollRef, "left")} className='absolute left-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10'>
              <FaCircleChevronLeft />
            </button>
          }

          <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={cateScrollRef}>
            {categories?.map((cate, index) => (
              <CategoryCard name={cate.category} image={cate.image} key={index} />
            ))}
          </div>

          {
            showRightCateButton && <button onClick={() => scrollHandler(cateScrollRef, "right")} className='absolute right-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10'>
              <FaCircleChevronRight />
            </button>
          }

        </div>
      </div>

      {
        currentCity && <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
          <h1 className='text-gray-800 text-2xl sm:text-3xl'>Best Shop in {currentCity}</h1>
          <div className='w-full relative'>
            {
              showLeftShopButton && <button onClick={() => scrollHandler(shopScrollRef, "left")} className='absolute left-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10'>
                <FaCircleChevronLeft />
              </button>
            }

            <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={shopScrollRef}>
              {shopsInMyCity?.map((shop, index) => (
                <CategoryCard name={shop.name} image={shop.image} key={index} />
              ))}
            </div>

            {
              showRightShopButton && <button onClick={() => scrollHandler(shopScrollRef, "right")} className='absolute right-0 top-1/2 -translate-y-1/2 bg-primaryColor text-white p-2 rounded-full shadow-lg hover:bg-hoverColor z-10'>
                <FaCircleChevronRight />
              </button>
            }


          </div>
        </div>
      }

      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
        <h1 className='text-gray-800 text-2xl sm:text-3xl'>Suggested Food Items</h1>

        <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={shopScrollRef}>
          {itemsInMyCity?.map((item, index) => (
            <FoodCard data={item} key={index} />
          ))}
        </div>

      </div>


    </div>
  )
}

export default UserDashboard