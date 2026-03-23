import { useNavigate } from "react-router-dom";

import { Button, Grid, Typography } from "@mui/material";

export default function PaymentSucceed() {
  const navigate = useNavigate();

  return (
    <Grid container flexDirection={"column"} alignItems="center" gap="20px">
      <Typography variant="h5" color="primary">
        Thank you. Your payment was successful.
      </Typography>
      <Button variant="contained" size="large" onClick={() => navigate("/account")}>
        Go to account page
      </Button>
    </Grid>
  );
}

