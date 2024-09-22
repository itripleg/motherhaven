// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0Ep-NrsrXsZV5HZg0I1Jr6Ay84SImCTk",
  authDomain: "redapple-4e54a.firebaseapp.com",
  projectId: "redapple-4e54a",
  storageBucket: "redapple-4e54a.appspot.com",
  messagingSenderId: "765615048252",
  appId: "1:765615048252:web:1dce807cf3bd99ca84a539",
  measurementId: "G-VMYFEVP4SM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
