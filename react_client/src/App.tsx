import React, { useState, useRef } from "react";

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";

import "react-image-crop/dist/ReactCrop.css";
import {
  Box,
  Button,
  CssBaseline,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function App() {
  const [imgSrc, setImgSrc] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [predictionResult, setPredictionResult] = useState<string[]>([]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
      });
      reader.readAsDataURL(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  async function onDownloadCropClick() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error("Crop canvas does not exist");
    }

    // This will size relative to the uploaded image
    // size. If you want to size according to what they
    // are looking at on screen, remove scaleX + scaleY
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    const ctx = offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Now you can use ctx.drawImage as expected

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    );
    // You might want { type: "image/jpeg", quality: <0 to 1> } to
    // reduce image size
    const blob = await offscreen.convertToBlob({
      type: "image/png",
    });

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = URL.createObjectURL(blob);
    hiddenAnchorRef.current!.href = blobUrlRef.current;
    hiddenAnchorRef.current!.click();
  }

  const onExportClick = async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error("Crop canvas does not exist");
    }

    // This will size relative to the uploaded image
    // size. If you want to size according to what they
    // are looking at on screen, remove scaleX + scaleY
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    const ctx = offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Now you can use ctx.drawImage as expected

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    const blob = await offscreen.convertToBlob({
      type: "image/png",
    });

    const formData = new FormData();
    // Добавляем blob как файл
    formData.append("file", blob, "crop.png");

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      console.log(result.prediction[0]);
      setPredictionResult(result.prediction[0]);
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  };

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate
        );
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  function handleToggleAspectClick() {
    if (aspect) {
      setAspect(undefined);
    } else {
      setAspect(16 / 9);

      if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, 16 / 9);
        setCrop(newCrop);
        // Updates the preview
        setCompletedCrop(convertToPixelCrop(newCrop, width, height));
      }
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box className="App">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 3,
          }}
          className="Crop-Controls"
        >
          <Box
            sx={{
              width: 400,
              display: "flex",
              flexDirection: "row",
              gap: 2,
              alignItems: "center",
              mb: 2,
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <Button
              sx={{ width: "300" }}
              variant="contained"
              color="primary"
              onClick={handleButtonClick}
            >
              Upload Image
            </Button>
            {imgSrc && <Typography>{fileName}</Typography>}
          </Box>
          <Box sx={{ mb: 2 }}>
            <TextField
              type="number"
              id="scale-input"
              label={"Scale:"}
              value={scale}
              disabled={!imgSrc}
              inputProps={{
                maxLength: 15,
                step: "0.1",
              }}
              onChange={(e) =>
                setScale(
                  Number(e.target.value) < 1 ? 1 : Number(e.target.value)
                )
              }
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", mb: 2, gap: 4 }}>
            <TextField
              id="rotate-input"
              label={"Rotate:"}
              value={rotate}
              disabled={!imgSrc}
              onChange={(e) =>
                setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
              }
            />

            {predictionResult.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography>Result:</Typography>
                {predictionResult.map((item, index) => (
                  <Typography key={index}>{item.trim()}</Typography>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              sx={{ mb: 2 }}
              onClick={handleToggleAspectClick}
            >
              Toggle aspect {aspect ? "off" : "on"}
            </Button>
            <Button
              disabled={!fileName}
              variant="contained"
              sx={{ mb: 2 }}
              onClick={onDownloadCropClick}
            >
              Download Crop
            </Button>
            <Button
              disabled={!fileName}
              variant="contained"
              sx={{ mb: 2 }}
              onClick={onExportClick}
            >
              Export to model
            </Button>
            <a
              href="#hidden"
              ref={hiddenAnchorRef}
              download
              style={{
                position: "absolute",
                top: "-200vh",
                visibility: "hidden",
              }}
            >
              Hidden download
            </a>
          </Box>
        </Box>
        {!!imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            // minWidth={400}
            minHeight={20}
            // circularCrop
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        )}
        {!!completedCrop && (
          <>
            <Box sx={{ mb: 2 }}>
              <canvas
                ref={previewCanvasRef}
                style={{
                  border: "1px solid black",
                  objectFit: "contain",
                  width: completedCrop.width,
                  height: completedCrop.height,
                }}
              />
            </Box>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
