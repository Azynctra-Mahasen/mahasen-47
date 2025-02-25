
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

  const getCroppedImg = () => {
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

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
        onOpenChange(false);
      }
    }, 'image/jpeg', 0.9);
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
