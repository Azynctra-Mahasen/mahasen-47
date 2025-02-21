
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
    <Card>
      <CardHeader>
        <CardTitle>Platform Secrets</CardTitle>
        <CardDescription>
          Manage your WhatsApp integration secrets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="whatsapp_phone_id">WhatsApp Phone ID</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="whatsapp_phone_id"
                type="password"
                value={secrets.whatsapp_phone_id}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_phone_id: e.target.value })}
                className="pl-10"
                placeholder="Enter WhatsApp Phone ID"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="whatsapp_verify_token">WhatsApp Verify Token</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="whatsapp_verify_token"
                type="password"
                value={secrets.whatsapp_verify_token}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_verify_token: e.target.value })}
                className="pl-10"
                placeholder="Enter WhatsApp Verify Token"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="whatsapp_access_token">WhatsApp Access Token</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="whatsapp_access_token"
                type="password"
                value={secrets.whatsapp_access_token}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_access_token: e.target.value })}
                className="pl-10"
                placeholder="Enter WhatsApp Access Token"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
