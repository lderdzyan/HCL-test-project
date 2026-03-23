import { JSX } from "react";

import Home from "@/views/home-page";
import CheckoutPage from "./views/checkout-page";
import AccountPage from "./views/account-page";
import SuccessPage from "./views/success-page";
import FailurePage from "./views/failure-page";

interface IRoute {
  path: string;
  element: JSX.Element;
}

export const routes: IRoute[] = [
  { path: "/", element: <Home /> },
  { path: "/checkout", element: <CheckoutPage /> },
  { path: "/account", element: <AccountPage /> },
  { path: "/success", element: <SuccessPage /> },
  { path: "/failure", element: <FailurePage /> },
];

