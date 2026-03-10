// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ¡REEMPLAZÁ ESTE OBJETO CON EL QUE TE DIO FIREBASE!
const firebaseConfig = {
  apiKey: "AIzaSyAou_HrKoWqUGDWUDTJh640Kz5g3Guk-EI",
  authDomain: "taller-flow-e2620.firebaseapp.com",
  projectId: "taller-flow-e2620",
  storageBucket: "taller-flow-e2620.firebasestorage.app",
  messagingSenderId: "354481079504",
  appId: "1:354481079504:web:cd22e55391830dde6f8ad5"
};

// 1. Inicializamos la conexión con tu proyecto de Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializamos Firestore y lo exportamos para usarlo en otras pantallas
export const db = getFirestore(app);