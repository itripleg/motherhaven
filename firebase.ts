// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC1Z0Nf7ahyL8MDylE5HMhevPx1-QiMOcQ",
  authDomain: "fakebook-1b26a.firebaseapp.com",
  projectId: "fakebook-1b26a",
  storageBucket: "fakebook-1b26a.appspot.com",
  messagingSenderId: "624899786808",
  appId: "1:624899786808:web:f3d8fcf7573efd58babecd",
};

// const firebaseConfig = {
//   apiKey: "AIzaSyBORt9fjGs3pMnD0z_qIFCk9sy_3oyPp-Y",
//   authDomain: "motherhaven-58df8.firebaseapp.com",
//   projectId: "motherhaven-58df8",
//   storageBucket: "motherhaven-58df8.firebasestorage.app",
//   messagingSenderId: "578250767326",
//   appId: "1:578250767326:web:2e7228eabc48ad06e03b4f"
// };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };


