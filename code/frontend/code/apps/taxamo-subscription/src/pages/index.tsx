import { createHashRouter, Outlet, RouterProvider } from "react-router-dom";
import Head from "next/head";

import { routes } from "@/routes";
import styles from "@/styles/page.module.css";
import Header from "@/components/layout/Header";

const GlobalLayout = () => {
  return (
    <>
      <Head>
        <link rel="icon" href={"favicon.ico"} />
      </Head>
      <Header />
      <main className={`${styles.main}`}>
        <Outlet />
      </main>
    </>
  );
};

export default function Main() {
  const router = createHashRouter([{ element: <GlobalLayout />, children: routes }]);
  return <RouterProvider router={router} />;
}

