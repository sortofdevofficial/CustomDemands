import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyD2dTyAjwRYZk8hTx382eaVVHI2PVYDET0",
  authDomain:         "customdemands-4378c.firebaseapp.com",
  projectId:          "customdemands-4378c",
  storageBucket:      "customdemands-4378c.firebasestorage.app",
  messagingSenderId:  "651269534278",
  appId:              "1:651269534278:web:9c2cbc638689f911731047",
  measurementId:      "G-LJB0W11D70"
};

export const app = initializeApp(firebaseConfig);

export let analytics = null;
analyticsSupported()
  .then(ok => { if (ok) analytics = getAnalytics(app); })
  .catch(() => {});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const db = getFirestore(app);

export {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
};