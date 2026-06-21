/* ================================
   CUSTOM DEMANDS — firebase.js
   Single source of truth for Firebase.
   Import what you need from this file —
   never call gstatic.com URLs anywhere else.
   ================================ */

import { initializeApp }     from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported }
                              from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
}                             from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  query,
  orderByChild,
  equalTo,
  limitToFirst
}                             from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

/* ---- Your web app's Firebase configuration ---- */
const firebaseConfig = {
  apiKey:            "AIzaSyD2dTyAjwRYZk8hTx382eaVVHI2PVYDET0",
  authDomain:         "customdemands-4378c.firebaseapp.com",
  projectId:          "customdemands-4378c",
  storageBucket:      "customdemands-4378c.firebasestorage.app",
  messagingSenderId:  "651269534278",
  appId:              "1:651269534278:web:9c2cbc638689f911731047",
  measurementId:      "G-LJB0W11D70"
};

/* ---- Initialize once ---- */
export const app = initializeApp(firebaseConfig);

/* Analytics can fail silently (ad-blockers, no https, SSR, etc.) — never let it break auth/db */
export let analytics = null;
analyticsSupported()
  .then(ok => { if (ok) analytics = getAnalytics(app); })
  .catch(() => { /* analytics unsupported in this environment — ignore */ });

/* ---- Auth ---- */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/* ---- Realtime Database ---- */
export const db = getDatabase(app);

/* ---- Re-export the modular functions used across the site ---- */
export {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  ref,
  get,
  set,
  update,
  query,
  orderByChild,
  equalTo,
  limitToFirst
};