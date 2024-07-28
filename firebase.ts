import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDBsrJpgctRiMK0UTxKUpvsKDsd7WRMIjE",
    authDomain: "pdf-buddy-7dbaf.firebaseapp.com",
    projectId: "pdf-buddy-7dbaf",
    storageBucket: "pdf-buddy-7dbaf.appspot.com",
    messagingSenderId: "824386588688",
    appId: "1:824386588688:web:c7989b8900ed2d89267a95"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };