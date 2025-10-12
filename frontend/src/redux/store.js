import { configureStore } from '@reduxjs/toolkit';
import userSlice from './userSlice';
import ownerSlice from './ownerSlice';
const store = configureStore({
    reducer: {
        user: userSlice,
        owner: ownerSlice
    }
})

export default store;