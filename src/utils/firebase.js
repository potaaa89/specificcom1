
// Firebase initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBbfNHJoAnJX-XDsDZuyokUzJwFO9LDbXE",
  authDomain: "chatapp-55bf0.firebaseapp.com",
  projectId: "chatapp-55bf0",
  storageBucket: "chatapp-55bf0.appspot.com",
  messagingSenderId: "196580310990",
  appId: "1:196580310990:web:ecd2e1ae7bbf7bf0bb359f",
  measurementId: "G-9X9HR31F3P"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
