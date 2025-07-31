"use client";

import React, { useContext, useState, useEffect } from "react";
import auth from "@/app/utils/fireAuth";
import { onAuthStateChanged } from "firebase/auth";
import { User } from "firebase/auth";

type FirebaseNextJSContextType = {
  userLoggedIn: boolean;
  isEmailUser: boolean;
  currentUser: User | null;
};

const FirebaseNextJSContext = React.createContext<FirebaseNextJSContextType>({
  userLoggedIn: false,
  isEmailUser: false,
  currentUser: null,
} as FirebaseNextJSContextType);

export function useFirebase() {
  return useContext(FirebaseNextJSContext);
}

export function FirebaseNextJSProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user: User | null) {
    console.log("user", user);
    if (user) {
      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);
      setCurrentUser({ ...user });
      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }

    setLoading(false);
  }

  const value = {
    userLoggedIn,
    isEmailUser,
    currentUser,
  };

  return (
    <FirebaseNextJSContext.Provider value={value}>
      {loading ? <main /> : children}
    </FirebaseNextJSContext.Provider>
  );
}
