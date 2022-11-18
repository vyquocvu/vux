import { useEffect, useState, useContext, createContext } from "react";
import firebase from "firebase/app";
import "firebase/auth";
import initFirebase from "./initFirebase";
import { setSession } from "./firebaseSessionHandler";
import { createAuthUserInfo } from "./user";

initFirebase();

// https://benmcmahen.com/using-firebase-with-react-hooks/

// Defaults to empty AuthUserInfo object.
export const AuthUserInfoContext = createContext(createAuthUserInfo());

export const useAuthUserInfo = () => {
  return useContext(AuthUserInfoContext);
};

// Returns a Firebase JS SDK user object.
export const useFirebaseAuth = () => {
  const [state, setState] = useState(() => {
    const user = firebase.auth().currentUser;
    return { initializing: !user, user, userSession: {} };
  });

  async function onChange(user: firebase.User | null) {
    // Call server to update session.
    const res = await setSession(user);
    const userSession = await res.json();
    setState({ initializing: false, user, userSession: userSession });
  }

  useEffect(() => {
    // Listen for auth state changes.
    const unsubscribe = firebase.auth().onAuthStateChanged(onChange);

    // Unsubscribe to the listener when unmounting.
    return () => unsubscribe();
  }, []);

  return state;
};
