import { Grid, Typography } from "@mui/material";

export default function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <Grid container columnSpacing={2} py={1}>
      <Grid item xs={12} sm={4}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Grid>

      <Grid item xs={12} sm={8}>
        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
          {value ?? "—"}
        </Typography>
      </Grid>
    </Grid>
  );
}
