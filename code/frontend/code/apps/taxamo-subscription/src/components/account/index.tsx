import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountContentSkeleton from "./skeleton";
import InfoRow from "./InfoRow";
import CancelSubscriptionDialog from "./dialog";

import { Button, Card, CardActions, CardContent, CardHeader, Divider, Stack } from "@mui/material";

type SubscriptionData = {
  email: string;
  subscriptionSince: string;
  renewalDate: string;
};

export default function AccountContent() {
  const navigate = useNavigate();

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubscriptionData({
        email: "vpashayanms@vtgsoftware.com",
        subscriptionSince: "2025-10-12",
        renewalDate: "2026-03-05",
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleCancel = async () => {
    setConfirmOpen(false);
    navigate("/checkout");
  };

  if (!subscriptionData) {
    return <AccountContentSkeleton />;
  }

  return (
    <>
      <Card sx={{ maxWidth: 500, width: "100%", backgroundColor: "#FCFAF8" }}>
        <CardHeader title="Example plan" subheader="Manage your subscription details" />

        <CardContent>
          <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
            <InfoRow label="Email" value={subscriptionData.email} />
            <InfoRow label="Member since" value={subscriptionData.subscriptionSince} />
            <InfoRow label="Next renewal" value={subscriptionData.renewalDate} />
          </Stack>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2, justifyContent: "flex-end" }}>
          <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)}>
            Cancel subscription
          </Button>
        </CardActions>
      </Card>

      <CancelSubscriptionDialog open={confirmOpen} renewalDate={subscriptionData.renewalDate} onClose={() => setConfirmOpen(false)} onConfirm={handleCancel} />
    </>
  );
}

