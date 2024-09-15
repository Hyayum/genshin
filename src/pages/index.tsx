import {
  Box,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import Link from "next/link";

export default function Home() {
  const links = [
    { "url": "expectation", label: "期待値計算機" },
    { "url": "atfscore", label: "カスタム聖遺物スコア計算機" },
  ];

  return (
    <>
      <Grid container spacing={3} sx={{ m: 5 }}>
        <Grid size={12}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            原神用計算機
          </Typography>

          <Box>
            {links.map((link) => (
              <Typography variant="subtitle2" key={link.label}>
                <Link href={link.url} style={{ color: "green", marginLeft: 1, textDecoration: "underline" }}>
                  {link.label}
                </Link>
              </Typography>
            ))}
          </Box>
        </Grid>
      </Grid>
    </>
  );
};
