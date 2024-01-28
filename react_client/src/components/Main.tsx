import React, { useState, useRef, useEffect } from "react";
import Draggable, { DraggableEventHandler } from "react-draggable";
import { Button, Box, Paper } from "@mui/material";

interface RectDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Main = () => {
  const [image, setImage] = useState<string | null>(null);
  const [rectDimensions, setRectDimensions] = useState<RectDimensions>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const reader = new FileReader();

    if (file) {
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setImage(e.target?.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDrag: DraggableEventHandler = (e, ui) => {
    setRectDimensions({
      ...rectDimensions,
      x: ui.x,
      y: ui.y,
    });
  };

  useEffect(() => {
    // const updateZoomedImage = () => {
    //   if (imageRef.current) {
    //     const canvas = document.createElement("canvas");
    //     const ctx = canvas.getContext("2d");
    //     if (ctx) {
    //       const { x, y, width, height } = rectDimensions;
    //       canvas.width = width;
    //       canvas.height = height;
    //       ctx.drawImage(imageRef.current, -x, -y);
    //       const zoomedImage = canvas.toDataURL();
    //       setImage(zoomedImage);
    //     }
    //   }
    // };
    // updateZoomedImage();
  }, [rectDimensions]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        p: 5,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Box sx={{ width: "80%" }}>
        {image && (
          <Box mt={2} sx={{ height: "100%", position: "relative" }}>
            <Paper sx={{ height: "100%" }}>
              <img
                ref={imageRef}
                src={image}
                alt="Uploaded"
                width="100%"
                height="100%"
                style={{ objectFit: "contain" }}
              />
              <Draggable
                bounds="parent"
                position={{ x: rectDimensions.x, y: rectDimensions.y }}
                onDrag={handleDrag}
              >
                <div
                  style={{
                    width: `${rectDimensions.width}px`,
                    height: `${rectDimensions.height}px`,
                    border: "2px solid red",
                    position: "absolute",
                    cursor: "move",
                  }}
                ></div>
              </Draggable>
            </Paper>
          </Box>
        )}
      </Box>
      <Box sx={{ width: "20%" }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
          id="imageInput"
        />
        <label htmlFor="imageInput">
          <Button variant="contained" component="span">
            Load image
          </Button>
        </label>
      </Box>
    </Box>
  );
};

export default Main;
