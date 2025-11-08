import { configureStore } from '@reduxjs/toolkit';
import userSlice from './userSlice.js';
import ownerSlice from './ownerSlice.js';
import mapSlice from './mapSlice.js'
const store = configureStore({
    reducer: {
        user: userSlice,
        owner: ownerSlice,
        map: mapSlice
    }
})

export default store;