
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

interface PlatformsSectionProps {
  whatsappNumber: string;
  onWhatsappNumberChange: (value: string) => void;
}

export const PlatformsSection = ({
  whatsappNumber,
  onWhatsappNumberChange
}: PlatformsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Platforms</CardTitle>
        <CardDescription>
          Manage your connected messaging platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => onWhatsappNumberChange(e.target.value)}
                className="pl-10"
                placeholder="Enter WhatsApp number"
              />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Include country code (e.g., +1234567890)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
