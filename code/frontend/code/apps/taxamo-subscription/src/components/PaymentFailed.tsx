import { useNavigate } from "react-router-dom";

import { Button, Grid, Typography } from "@mui/material";

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <Grid container flexDirection={"column"} alignItems="center" gap="20px">
      <Typography variant="h5" color="primary">
        Your payment failed. Please try later.
      </Typography>
      <Button variant="contained" size="large" onClick={() => navigate("/")}>
        Go to home
      </Button>
    </Grid>
  );
}

