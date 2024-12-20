import { Paper, Typography, Box, Button } from "@mui/material";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

export const Tasks = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        px: 3,
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <Paper
        sx={{
          p: 1,
          mt: 6,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          height: "calc(100% - 80px)",
          boxSizing: "border-box",
          gap: 4,
        }}
      >
        <Button
          onClick={() => navigate("/shop")}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            border: "1px solid gray",
            borderRadius: 2,
            width: "90%",
            height: "100px",
            background: "#DEE0E5",
            mt: 2,
          }}
        >
          <Typography
            component="p"
            sx={{
              textAlign: { xs: "center", sm: "left" },
              color: "#000",
            }}
          >
            {t("tasks.price_collection")}
          </Typography>
        </Button>
        <Button
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            border: "1px solid gray",
            borderRadius: 2,
            width: "90%",
            height: "100px",
            background: "#DEE0E5",
          }}
        >
          <Typography
            component="p"
            sx={{
              textAlign: { xs: "center", sm: "left" },
              color: "#000",
            }}
          >
            {t("tasks.price_collection")}
          </Typography>
        </Button>
      </Paper>
    </Box>
  );
};
