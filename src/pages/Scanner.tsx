import { useState, useRef, useEffect } from "react";
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
} from "@mui/material";
import EXIF from "exif-js";
import { Close } from "@mui/icons-material";
import { useLanguage } from "../contexts/LanguageContext";
import { usePermissions } from "../contexts/PermissionsContext";
import { BarcodeScanner } from "../components/BarcodeScanner";

interface ScannerProps {
  token: string;
}

interface SubmissionData {
  images: File[];
  previews: string[];
  priceImage: File[];
  pricePreviews: string[];
  barcode: string;
  shopLocation: string;
  skuPrice: string;
  skuName: string;
  comments: string;
}

const Scanner = ({ token }: ScannerProps) => {
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    images: [],
    previews: [],
    priceImage: [],
    pricePreviews: [],
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
  const file2InputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType?: "main" | "price"
  ) => {
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
      console.log("handleImageUpload", imageType, newFiles, newPreviews);
      if (imageType === "price") {
        setSubmissionData((prev) => ({
          ...prev,
          priceImage: newFiles,
          pricePreviews: newPreviews,
        }));
      } else {
        setSubmissionData((prev) => ({
          ...prev,
          images: newFiles,
          previews: newPreviews,
        }));
      }
    }
  };

  const handleRemoveImage = (imageType?: "main" | "price") => {
    setSubmissionData((prev) => {
      // Revoke the URL to prevent memory leaks
      // URL.revokeObjectURL(prev.previews[index]);

      // const newImages = [...prev.images];
      // const newPreviews = [...prev.previews];
      // newImages.splice(index, 1);
      // newPreviews.splice(index, 1);
      if (imageType === "price") {
        return {
          ...prev,
          priceImage: [],
          pricePreviews: [],
        };
      } else {
        return {
          ...prev,
          images: [],
          previews: [],
        };
      }
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
    submissionData.priceImage.forEach((image, index) => {
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
        priceImage: [],
        pricePreviews: [],
        barcode: "",
        shopLocation: "",
        skuPrice: "",
        skuName: "",
        comments: "",
      });
      setShowConfirmation(false);
    } catch (err: unknown) {
      console.log(err);
      setError("Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{ px: 2, width: "100vw", height: "100vh", boxSizing: "border-box" }}
    >
      <Paper
        sx={{
          p: 2,
          pt: 10,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          height: "calc(100% - 50px)",
          boxSizing: "border-box",
          gap: 2,
        }}
      >
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

        {submissionData.barcode ? (
          <>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {(() => {
                const disable = !(
                  submissionData.barcode &&
                  submissionData.images &&
                  submissionData.priceImage &&
                  submissionData.skuPrice
                );
                return (
                  <Button
                    disabled={disable}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid",
                      borderColor: disable ? "#DEE0E5" : "#53CA89",
                      borderRadius: 1,
                      height: "40px",
                      minWidth: "100px",
                    }}
                    // onClick={() => ()}
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
                );
              })()}
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                width: "100%",
                gap: 1,
              }}
            >
              <Typography>{t("scanner.enter_price")}</Typography>
              <TextField
                sx={{ width: "100%" }}
                value={submissionData.skuPrice}
                onChange={(e) =>
                  setSubmissionData((prev) => {
                    return { ...prev, skuPrice: e.target.value };
                  })
                }
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box>
                {submissionData.images.length ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(100px, 1fr))",
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
                          onClick={() => handleRemoveImage("main")}
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
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "main")}
                      ref={fileInputRef}
                      multiple
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        height: "100px",
                        background: "#DEE0E5",
                        color: "#000",
                        minWidth: "150px",
                      }}
                    >
                      {t("scanner.uploadImage")}
                    </Button>
                  </>
                )}
              </Box>
              <Box>
                {submissionData.priceImage.length ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    {submissionData.pricePreviews.map((preview, index) => (
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
                          onClick={() => handleRemoveImage("price")}
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
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "price")}
                      ref={file2InputRef}
                      multiple
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => file2InputRef.current?.click()}
                      sx={{
                        height: "100px",
                        background: "#DEE0E5",
                        color: "#000",
                        minWidth: "150px",
                      }}
                    >
                      {t("scanner.uploadPriceImage")}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="h6">{t("scanner.pointInfo")}</Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={
                isScanning ? () => setIsScanning(false) : handleStartScanning
              }
              sx={{
                height: "100px",
                width: "100%",
                background: "#DEE0E5",
                color: "#000",
              }}
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
        )}
      </Paper>

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
