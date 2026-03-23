import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { emailValidationReg } from "@/utils/validation";
import { createId } from "@paralleldrive/cuid2";
import { checkUser } from "@/api/requests";

import { Grid, Typography, TextField, Button } from "@mui/material";

export default function PreSubscription() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const isValidEmail = emailValidationReg.test(email);

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isValidEmail) return;

    try {
      const pid = createId();
      const { userInfo } = await checkUser({ email, pid });
      localStorage.setItem("subscriptionUserInfo", JSON.stringify({ email, pid }));
      userInfo.stripeSubscriptionId ? navigate("/account") : navigate("/checkout");
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <Grid container flexDirection="column" alignItems="center" gap="20px">
      <Typography variant="h5">Please enter your email</Typography>
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={submitted && !isValidEmail}
        helperText={submitted && !isValidEmail && "Please enter a valid email"}
        type="email"
      />
      <Button variant="contained" onClick={handleSubmit}>
        Go to subscription page
      </Button>
      <Typography color="error">{error}</Typography>
    </Grid>
  );
}

