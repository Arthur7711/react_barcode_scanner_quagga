import { Paper, Typography, Box, Button, TextField } from "@mui/material";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface IProps {
  shopName: string;
  setShopName: (name: string) => void;
}
export const Shop = ({ shopName, setShopName }: IProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        px: 2,
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
      }}
    >
      <Paper
        sx={{
          p: 2,
          pt: 10,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          height: "calc(100% - 50px)",
          boxSizing: "border-box",
          gap: 4,
        }}
      >
        <Typography
          component="p"
          sx={{
            color: "#000",
            width: "100%",
          }}
        >
          {t("shop.enter_store")}
        </Typography>
        <TextField
          value={shopName}
          onChange={(event) => setShopName(event.target.value)}
          sx={{ width: "100%" }}
        />
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            disabled={!shopName}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid",
              borderColor: shopName ? "#53CA89" : "#DEE0E5",
              borderRadius: 1,
              height: "40px",
              minWidth: "100px",
            }}
            onClick={() => navigate("/scanner")}
          >
            <Typography
              component="p"
              sx={{
                textAlign: { xs: "center", sm: "left" },
                color: "#000",
              }}
            >
              {t("shop.save")}
            </Typography>
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
