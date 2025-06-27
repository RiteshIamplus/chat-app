// components/RedirectIfLoggedIn.tsx

import { Navigate } from "react-router-dom";

const RedirectIfLoggedIn = ({ children }: { children: JSX.Element }) => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  if (user) {
    return <Navigate to="/chatlist" replace />;
  }

  return children;
};

export default RedirectIfLoggedIn;
