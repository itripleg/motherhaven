// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1Z0Nf7ahyL8MDylE5HMhevPx1-QiMOcQ",
  authDomain: "fakebook-1b26a.firebaseapp.com",
  projectId: "fakebook-1b26a",
  storageBucket: "fakebook-1b26a.appspot.com",
  messagingSenderId: "624899786808",
  appId: "1:624899786808:web:f3d8fcf7573efd58babecd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
