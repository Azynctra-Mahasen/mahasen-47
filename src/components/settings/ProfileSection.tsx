
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Mail, User } from "lucide-react";
import { ImageCropDialog } from "./ImageCropDialog";

interface ProfileSectionProps {
  username: string;
  email: string;
  profileUrl: string;
  loading: boolean;
  onUsernameChange: (value: string) => void;
  onFileUpload: (file: File) => void;
}

export const ProfileSection = ({
  username,
  email,
  profileUrl,
  loading,
  onUsernameChange,
  onFileUpload
}: ProfileSectionProps) => {
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setCropDialogOpen(true);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "cropped-profile-picture.jpg", { type: "image/jpeg" });
    onFileUpload(file);
    URL.revokeObjectURL(selectedImageUrl);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Profile</CardTitle>
        <CardDescription>
          Manage your shop profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div>
          <Label>Shop Profile Picture</Label>
          <div className="mt-2 flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileUrl} />
              <AvatarFallback>
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label
                htmlFor="picture"
                className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-md cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload New Picture
              </Label>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={loading}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                JPG, GIF or PNG. Max size of 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="pl-10"
              placeholder="Enter username"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={email}
              className="pl-10"
              placeholder="Enter email"
              disabled
            />
          </div>
        </div>

        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageUrl={selectedImageUrl}
          onCropComplete={handleCropComplete}
        />
      </CardContent>
    </Card>
  );
};
