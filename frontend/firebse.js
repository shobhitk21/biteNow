// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "bitenow-food-delivery-e3df6.firebaseapp.com",
    projectId: "bitenow-food-delivery-e3df6",
    storageBucket: "bitenow-food-delivery-e3df6.firebasestorage.app",
    messagingSenderId: "283539653537",
    appId: "1:283539653537:web:e2974ade1f01dca6af01e0",
    measurementId: "G-CB157EL5P4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export default auth ;