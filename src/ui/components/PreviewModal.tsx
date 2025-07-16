// src/ui/components/PreviewModal.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";

interface PreviewItem {
  id: string;
  image: string; // 縮圖或 poster
  url: string; // 媒體 URL
  width?: number;
  height?: number;
}

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  items: PreviewItem[];
  loading: boolean;
  error: string | null;
  mediaType: "image" | "video";
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onClose,
  items,
  loading,
  error,
  mediaType,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    PaperProps={{ sx: { minHeight: "60vh" } }}
  >
    <DialogTitle>
      Preview&nbsp;{mediaType === "image" ? "Images" : "Videos"}
    </DialogTitle>

    <DialogContent>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <Typography color="error">{error}</Typography>
        </Box>
      ) : items.length === 0 ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <Typography>No results found</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                {mediaType === "video" ? (
                  <CardMedia
                    component="video"
                    src={item.url}
                    poster={item.image}
                    controls
                    loop
                    muted
                    preload="metadata"
                    sx={{ height: 200, objectFit: "cover" }}
                  />
                ) : (
                  <CardMedia
                    component="img"
                    image={item.image}
                    sx={{ height: 200, objectFit: "cover" }}
                  />
                )}

                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {item.width && item.height
                      ? `${item.width} × ${item.height}`
                      : ""}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </DialogContent>

    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);
