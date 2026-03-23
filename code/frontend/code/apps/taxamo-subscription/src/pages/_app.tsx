import { useEffect, useState } from "react";
import type { AppProps } from "next/app";

import "../styles/globals.css";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "../styles/theme";

export default function App({ Component, pageProps }: AppProps) {
  const [render, setRender] = useState(false);

  useEffect(() => {
    setRender(true);
  }, []);

  return render ? (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  ) : null;
}

