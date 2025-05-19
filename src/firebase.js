// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTxwuLWU6IfEIfDYugW5YVlky8kiV4Hks",
  authDomain: "meal-planner-rckrockerz.firebaseapp.com",
  projectId: "meal-planner-rckrockerz",
  storageBucket: "meal-planner-rckrockerz.firebasestorage.app",
  messagingSenderId: "997138932612",
  appId: "1:997138932612:web:59eee8492989700bc3b3d1",
  measurementId: "G-NGX612MN17",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
