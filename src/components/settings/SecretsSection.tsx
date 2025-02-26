
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";

interface SecretsSectionProps {
  secrets: {
    whatsapp_phone_id: string;
    whatsapp_verify_token: string;
    whatsapp_access_token: string;
  };
  onSecretsChange: (secrets: {
    whatsapp_phone_id: string;
    whatsapp_verify_token: string;
    whatsapp_access_token: string;
  }) => void;
}

export const SecretsSection = ({ secrets, onSecretsChange }: SecretsSectionProps) => {
  return (
    <Card className="border-red-500">
      <CardHeader className="border-b border-red-200">
        <CardTitle className="text-red-500">Platform Secrets</CardTitle>
        <CardDescription className="text-red-400">
          Manage your WhatsApp integration secrets. These are required for sending messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="whatsapp_phone_id" className="text-red-500">WhatsApp Phone ID</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-red-400" />
              <Input
                id="whatsapp_phone_id"
                name="whatsapp_phone_id"
                value={secrets.whatsapp_phone_id}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_phone_id: e.target.value })}
                className="pl-10 border-red-200 focus-visible:ring-red-500"
                placeholder="Enter WhatsApp Phone ID"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="whatsapp_verify_token" className="text-red-500">WhatsApp Verify Token</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-red-400" />
              <Input
                id="whatsapp_verify_token"
                name="whatsapp_verify_token"
                value={secrets.whatsapp_verify_token}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_verify_token: e.target.value })}
                className="pl-10 border-red-200 focus-visible:ring-red-500"
                placeholder="Enter WhatsApp Verify Token"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="whatsapp_access_token" className="text-red-500">WhatsApp Access Token</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-red-400" />
              <Input
                id="whatsapp_access_token"
                name="whatsapp_access_token"
                value={secrets.whatsapp_access_token}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_access_token: e.target.value })}
                className="pl-10 border-red-200 focus-visible:ring-red-500"
                placeholder="Enter WhatsApp Access Token"
                required
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
