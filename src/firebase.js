import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVO05hJPeie0zk2mtv1Q7X0uOXO0kC9mk",
  authDomain: "kkmap-c184a.firebaseapp.com",
  projectId: "kkmap-c184a",
  storageBucket: "kkmap-c184a.firebasestorage.app",
  messagingSenderId: "116773156327",
  appId: "1:116773156327:web:70b36cf2f885035512f942",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
