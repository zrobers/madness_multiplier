
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhOBADb2yg3rBV93SpgkXeX1Acuvk8wEM",
  authDomain: "madness-multiplier-329ef.firebaseapp.com",
  projectId: "madness-multiplier-329ef",
  storageBucket: "madness-multiplier-329ef.firebasestorage.app",
  messagingSenderId: "168294243003",
  appId: "1:168294243003:web:e3e316a6270c85273ae79e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
