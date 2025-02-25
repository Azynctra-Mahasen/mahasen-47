
import { useState } from "react";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

export const ImageCropDialog = ({ open, onOpenChange, imageUrl, onCropComplete }: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const smallerDimension = Math.min(width, height);
    const crop: Crop = {
      unit: '%',
      width: (smallerDimension / width) * 100,
      height: (smallerDimension / height) * 100,
      x: ((width - smallerDimension) / width) * 50,
      y: ((height - smallerDimension) / height) * 50,
    };
    setCrop(crop);
    setImageRef(e.currentTarget);
  };

  const compressImage = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas to Blob conversion failed');
            return;
          }

          // If the blob is already small enough, return it directly
          if (blob.size <= 2 * 1024 * 1024) {
            resolve(blob);
            return;
          }

          // Create a new image from the blob
          const img = new Image();
          img.src = URL.createObjectURL(blob);
          
          img.onload = () => {
            URL.revokeObjectURL(img.src);
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            // Create a new canvas for the compressed image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              console.error('Failed to get canvas context');
              resolve(blob);
              return;
            }

            // Draw the image with the new dimensions
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with compression
            canvas.toBlob(
              (compressedBlob) => {
                resolve(compressedBlob || blob);
              },
              'image/jpeg',
              0.8 // Compression quality (0.8 = 80%)
            );
          };
        },
        'image/jpeg',
        1.0
      );
    });
  };

  const getCroppedImg = async () => {
    if (!imageRef) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;
    
    const pixelCrop = {
      x: (crop.x * imageRef.width * scaleX) / 100,
      y: (crop.y * imageRef.height * scaleY) / 100,
      width: (crop.width * imageRef.width * scaleX) / 100,
      height: (crop.height * imageRef.height * scaleY) / 100,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imageRef,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    try {
      const compressedBlob = await compressImage(canvas);
      onCropComplete(compressedBlob);
      onOpenChange(false);
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            aspect={1}
            circularCrop
            keepSelection
            className="max-h-[60vh] mx-auto"
          >
            <img
              src={imageUrl}
              onLoad={onImageLoad}
              alt="Crop"
              className="max-w-full max-h-[60vh] object-contain"
            />
          </ReactCrop>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={getCroppedImg}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
