import { createBrowserRouter } from "react-router";
import { WelcomePage } from "@/app/pages/WelcomePage";
import { ShoppingCartPage } from "@/app/pages/ShoppingCartPage";
import { CompletedPage } from "@/app/pages/CompletedPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: WelcomePage,
  },
  {
    path: "/cart",
    Component: ShoppingCartPage,
  },
  {
    path: "/completed",
    Component: CompletedPage,
  },
]);
