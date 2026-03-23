import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

type Props = {
  open: boolean;
  renewalDate: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelSubscriptionDialog({ open, renewalDate, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cancel subscription?</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Your subscription will remain active until <strong>{renewalDate}</strong>. After that, you won’t be billed again.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          Confirm cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

