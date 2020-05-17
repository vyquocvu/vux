// From:
// https://github.com/zeit/next.js/blob/canary/examples/with-firebase-authentication/pages/index.js

import fetch from "isomorphic-unfetch";

export const setSession = async (user: firebase.User | null) => {
  if (user) {
    const token = await user.getIdToken();
    const response = await fetch("/api/login", {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      credentials: "same-origin",
      body: JSON.stringify({ token })
    });
    return response;
  }

  // Log out.
  return fetch("/api/logout", {
    method: "POST",
    credentials: "same-origin"
  });
};
