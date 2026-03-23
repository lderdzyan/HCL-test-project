import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CheckoutStatus, makePurchase } from "./helpers/makePurchase";
import { checkPaymentStatus, savePaymentResult } from "@/api/requests";

import { Button, CircularProgress, Typography } from "@mui/material";

export default function SubscriptionCheckout() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    const userInfo = JSON.parse(localStorage.getItem("subscriptionUserInfo") as string);
    if (!userInfo) return;
    const result = await makePurchase(userInfo);
    if (result?.status === CheckoutStatus.COMPLETED) {
      setLoading(true);
      try {
        await savePaymentResult(result);
        pollPaymentStatus("id"); // TODO correct id
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          setError(`Error: ${err.message}`);
        } else {
          setError("Something went wrong");
        }
      }
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    const poll = async () => {
      try {
        const response = await checkPaymentStatus({ id: paymentId });
        if (response.status === "DONE") {
          navigate("/success");
          return;
        } else if(response.status === "FAILED") {
          navigate("/failure");
          return;
        }
        setTimeout(poll, 6000);
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      }
    };
    poll();
  };

  return (
    <>
      <Button variant="contained" size="large" onClick={handleSubscribe} disabled={loading} endIcon={loading ? <CircularProgress size={20} /> : null}>
        Subscribe
      </Button>
      <Typography color="error">{error}</Typography>
    </>
  );
}

