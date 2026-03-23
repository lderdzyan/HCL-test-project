import { Card, CardActions, CardContent, CardHeader, Divider, Grid, Skeleton, Stack } from "@mui/material";

const InfoRowSkeleton = () => (
  <Grid container columnSpacing={2} py={1}>
    <Grid item xs={12} sm={4}>
      <Skeleton variant="text" width="80%" height={20} />
    </Grid>
    <Grid item xs={12} sm={8}>
      <Skeleton variant="text" width="100%" height={20} />
    </Grid>
  </Grid>
);

export default function AccountContentSkeleton() {
  return (
    <Card sx={{ maxWidth: 500, width: "100%" }}>
      <CardHeader title={<Skeleton variant="text" width={160} />} subheader={<Skeleton variant="text" width={220} />} />

      <CardContent>
        <Stack divider={<Divider flexItem />}>
          <InfoRowSkeleton />
          <InfoRowSkeleton />
          <InfoRowSkeleton />
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, justifyContent: "flex-end" }}>
        <Skeleton variant="rounded" width={170} height={36} />
      </CardActions>
    </Card>
  );
}

