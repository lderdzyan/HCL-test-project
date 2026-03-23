import Image from "next/image";
import Link from "next/link";

import { Box, Toolbar, AppBar } from "@mui/material";

export default function Header() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#fff",
          p: "24px",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "center",
          }}
        >
          <Link href={window.location.origin}>
            <Image src="logo_main_colorful.svg" width={214} height={30} alt="MeaningSphere logo" />
          </Link>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

