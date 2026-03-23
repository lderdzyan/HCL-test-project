import { createTheme } from "@mui/material/styles";
import { Source_Sans_3 } from "next/font/google";

const sourceSans = Source_Sans_3({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const theme = createTheme({
  typography: {
    fontFamily: sourceSans.style.fontFamily,
  },
  palette: {
    primary: {
      main: "#8679AF",
    },
    text: {
      primary: "#2C2D30",
    },
  },
});

export default theme;

