import { useState, useRef, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from "@mui/material";
import EXIF from "exif-js";
import {
  LocationOn,
  AttachMoney,
  Inventory,
  Close,
  Logout,
} from "@mui/icons-material";
import { useLanguage } from "../contexts/LanguageContext";
import { usePermissions } from "../contexts/PermissionsContext";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { useNavigate } from "react-router-dom";

interface ScannerProps {
  token: string;
  userEmail: string;
  onLogout?: () => void;
}

interface SubmissionData {
  images: File[];
  previews: string[];
  barcode: string;
  shopLocation: string;
  skuPrice: string;
  skuName: string;
  comments: string;
}

const Scanner = ({ token, userEmail, onLogout }: ScannerProps) => {
  const navigate = useNavigate();
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    images: [],
    previews: [],
    barcode: "",
    shopLocation: "",
    skuPrice: "",
    skuName: "",
    comments: "",
  });
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t } = useLanguage();
  const {
    camera,
    geolocation,
    error: permissionError,
    requestPermissions,
    requestCameraPermission,
  } = usePermissions();

  useEffect(() => {
    const requestLocationInBackground = async () => {
      try {
        await requestPermissions();
      } catch (err) {
        console.log("Location permission request failed:", err);
        // Don't show error - location is optional
      }
    };
    requestLocationInBackground();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      // Process EXIF data for each image
      newFiles.forEach((file) => {
        EXIF.getData(file as any, function (this: any) {
          const exifData = EXIF.getAllTags(this);
          if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
            const latitude = EXIF.getTag(this, "GPSLatitude");
            const longitude = EXIF.getTag(this, "GPSLongitude");
            console.log("EXIF location:", { latitude, longitude });
          }
        });
      });

      setSubmissionData((prev) => ({
        ...prev,
        images: [...prev.images, ...newFiles],
        previews: [...prev.previews, ...newPreviews],
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setSubmissionData((prev) => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev.previews[index]);

      const newImages = [...prev.images];
      const newPreviews = [...prev.previews];
      newImages.splice(index, 1);
      newPreviews.splice(index, 1);

      return {
        ...prev,
        images: newImages,
        previews: newPreviews,
      };
    });
  };

  const handleStartScanning = async () => {
    if (!camera) {
      const granted = await requestCameraPermission();
      if (!granted) {
        setError(permissionError || "Camera permission denied");
        return;
      }
    }
    console.log("StartScanning");
    setIsScanning(true);
    setError("");
  };

  const handleBarcodeDetected = (code: string) => {
    console.log("BarcodeDetected");
    setIsScanning(false);
    setSubmissionData((prev) => ({
      ...prev,
      barcode: code,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    submissionData.images.forEach((image, index) => {
      formData.append(`image${index}`, image);
    });
    formData.append("imageCount", submissionData.images.length.toString());
    formData.append("barcode", submissionData.barcode);
    formData.append("shopLocation", submissionData.shopLocation);
    formData.append("skuPrice", submissionData.skuPrice);
    formData.append("skuName", submissionData.skuName);
    formData.append("comments", submissionData.comments);
    if (geolocation) {
      formData.append("latitude", geolocation.latitude.toString());
      formData.append("longitude", geolocation.longitude.toString());
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      // Reset form after successful submission
      setSubmissionData({
        images: [],
        previews: [],
        barcode: "",
        shopLocation: "",
        skuPrice: "",
        skuName: "",
        comments: "",
      });
      setShowConfirmation(false);
    } catch (err) {
      setError("Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    if (onLogout) {
      onLogout();
    }
    navigate("/");
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Typography component="h1" variant="h5">
              {t("scanner.title")}
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                "& .MuiAlert-message": {
                  whiteSpace: "pre-line",
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              multiple
              style={{ display: "none" }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 1 }}
            >
              {t("scanner.uploadImage")}
            </Button>
            {submissionData.images.length > 0 && (
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("scanner.uploadedImages")} ({submissionData.images.length}
                  ):
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 1,
                  }}
                >
                  {submissionData.previews.map((preview, index) => (
                    <Box
                      key={preview}
                      sx={{
                        position: "relative",
                        paddingTop: "100%",
                        borderRadius: 1,
                        overflow: "hidden",
                        bgcolor: "grey.100",
                      }}
                    >
                      <Box
                        component="img"
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          bgcolor: "rgba(0, 0, 0, 0.5)",
                          "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.7)",
                          },
                        }}
                      >
                        <Close sx={{ color: "white", fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={
                isScanning ? () => setIsScanning(false) : handleStartScanning
              }
              color={isScanning ? "secondary" : "primary"}
              sx={{ mb: 1 }}
            >
              {isScanning
                ? t("scanner.stopScanning")
                : t("scanner.scanBarcode")}
            </Button>
            {isScanning && (
              <BarcodeScanner
                onDetected={handleBarcodeDetected}
                onError={setError}
              />
            )}
            {submissionData.barcode && (
              <Alert
                severity="success"
                sx={{ mt: 1 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => setIsScanning(true)}
                  >
                    {t("scanner.scanAgain")}
                  </Button>
                }
              >
                {t("scanner.barcodeDetected")}:{" "}
                <strong>{submissionData.barcode}</strong>
              </Alert>
            )}
          </Box>

          <TextField
            fullWidth
            label={t("scanner.shopLocation")}
            value={submissionData.shopLocation}
            onChange={(e) =>
              setSubmissionData((prev) => ({
                ...prev,
                shopLocation: e.target.value,
              }))
            }
            placeholder={t("scanner.shopLocationPlaceholder")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                "&.Mui-focused": {
                  backgroundColor: "background.paper",
                },
              },
            }}
          />

          <TextField
            fullWidth
            label={t("scanner.skuName")}
            value={submissionData.skuName}
            onChange={(e) =>
              setSubmissionData((prev) => ({
                ...prev,
                skuName: e.target.value,
              }))
            }
            placeholder={t("scanner.skuNamePlaceholder")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Inventory color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                "&.Mui-focused": {
                  backgroundColor: "background.paper",
                },
              },
            }}
          />

          <TextField
            fullWidth
            label={t("scanner.price")}
            value={submissionData.skuPrice}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              if (value === "") {
                setSubmissionData((prev) => ({ ...prev, skuPrice: "" }));
                return;
              }
              const number = parseInt(value, 10);
              if (!isNaN(number)) {
                setSubmissionData((prev) => ({
                  ...prev,
                  skuPrice: number.toLocaleString("en-US"),
                }));
              }
            }}
            placeholder={t("scanner.pricePlaceholder")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney color="action" />
                </InputAdornment>
              ),
              endAdornment: submissionData.skuPrice && (
                <InputAdornment position="end">UZS</InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                "&.Mui-focused": {
                  backgroundColor: "background.paper",
                },
              },
            }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label={t("scanner.comments")}
            value={submissionData.comments}
            onChange={(e) =>
              setSubmissionData((prev) => ({
                ...prev,
                comments: e.target.value,
              }))
            }
            placeholder={t("scanner.commentsPlaceholder")}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                "&.Mui-focused": {
                  backgroundColor: "background.paper",
                },
              },
            }}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => setShowConfirmation(true)}
            disabled={
              submissionData.images.length === 0 && !submissionData.barcode
            }
            sx={{ mb: 2 }}
          >
            {t("scanner.submit")}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleLogout}
            startIcon={<Logout />}
            sx={{ mb: 2 }}
          >
            {t("scanner.logoutTooltip")}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                fontStyle: "italic",
              }}
            >
              {t("scanner.loggedInAs")}: {userEmail}
            </Typography>
            {geolocation && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  mt: 0.5,
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                📍 {geolocation.latitude.toFixed(6)},{" "}
                {geolocation.longitude.toFixed(6)}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      >
        <DialogTitle>{t("scanner.confirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {t("scanner.confirmMessage")}
          </Typography>
          {submissionData.images.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                {t("scanner.uploadedImages")} ({submissionData.images.length}):
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: 1,
                  mb: 2,
                }}
              >
                {submissionData.previews.map((preview, index) => (
                  <Box
                    key={preview}
                    sx={{
                      position: "relative",
                      paddingTop: "100%",
                      borderRadius: 1,
                      overflow: "hidden",
                      bgcolor: "grey.100",
                    }}
                  >
                    <Box
                      component="img"
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}
          {submissionData.barcode && (
            <Typography variant="body2">
              {t("scanner.barcodeDetected")}: {submissionData.barcode}
            </Typography>
          )}
          {submissionData.shopLocation && (
            <Typography variant="body2">
              {t("scanner.shopLocation")}: {submissionData.shopLocation}
            </Typography>
          )}
          {submissionData.skuPrice && (
            <Typography variant="body2">
              {t("scanner.price")}: {submissionData.skuPrice} UZS
            </Typography>
          )}
          {submissionData.skuName && (
            <Typography variant="body2">
              {t("scanner.skuName")}: {submissionData.skuName}
            </Typography>
          )}
          {submissionData.comments && (
            <Typography variant="body2">
              {t("scanner.comments")}: {submissionData.comments}
            </Typography>
          )}
          {geolocation && (
            <Typography variant="body2">
              Location: {geolocation.latitude.toFixed(6)},{" "}
              {geolocation.longitude.toFixed(6)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)}>
            {t("scanner.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="contained"
            color="primary"
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              t("scanner.confirm")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Scanner;
