import { configureStore } from '@reduxjs/toolkit';
import userSlice from './userSlice.js';
import ownerSlice from './ownerSlice.js';
import mapSlice from './mapSlice.js'
const store = configureStore({
    reducer: {
        user: userSlice,
        owner: ownerSlice,
        map: mapSlice
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredPaths: ["user.socket"],
            },
        }),
})

export default store;