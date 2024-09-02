// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "wya-app-530d5.firebaseapp.com",
  projectId: "wya-app-530d5",
  storageBucket: "wya-app-530d5.appspot.com",
  messagingSenderId: "663230930206",
  appId: "1:663230930206:web:8954c9da3ca0c6ea8d3d0f",
  measurementId: "G-TW3P6945TN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;
