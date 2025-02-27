
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";

interface SecretsSectionProps {
  secrets: {
    whatsapp_phone_id: string;
    whatsapp_verify_token: string;
    whatsapp_access_token: string;
    groq_api_key?: string;
  };
  onSecretsChange: (secrets: {
    whatsapp_phone_id: string;
    whatsapp_verify_token: string;
    whatsapp_access_token: string;
    groq_api_key?: string;
  }) => void;
}

export const SecretsSection = ({ secrets, onSecretsChange }: SecretsSectionProps) => {
  return (
    <Card className="border-red-500">
      <CardHeader className="border-b border-red-200">
        <CardTitle className="text-red-500">Platform Secrets</CardTitle>
        <CardDescription className="text-red-400">
          Manage your WhatsApp integration secrets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 py-4">
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              These configurations are required to connect your WhatsApp Business account. 
              You need to set up a Meta Developer account and configure a WhatsApp Business API app.
            </p>
          </div>

          <div>
            <Label htmlFor="whatsapp_phone_id" className="text-red-500">WhatsApp Phone ID</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-red-400" />
              <Input
                id="whatsapp_phone_id"
                type="password"
                value={secrets.whatsapp_phone_id}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_phone_id: e.target.value })}
                className="pl-10 border-red-200 focus-visible:ring-red-500"
                placeholder="Enter WhatsApp Phone ID"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              The phone_number_id from the WhatsApp Business API (e.g., 123456789012345)
            </p>
          </div>

          <div>
            <Label htmlFor="whatsapp_verify_token" className="text-red-500">WhatsApp Verify Token</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-red-400" />
              <Input
                id="whatsapp_verify_token"
                type="password"
                value={secrets.whatsapp_verify_token}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_verify_token: e.target.value })}
                className="pl-10 border-red-200 focus-visible:ring-red-500"
                placeholder="Enter WhatsApp Verify Token"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              A custom verification token you create for webhook verification
            </p>
          </div>

          <div>
            <Label htmlFor="whatsapp_access_token" className="text-red-500">WhatsApp Access Token</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-red-400" />
              <Input
                id="whatsapp_access_token"
                type="password"
                value={secrets.whatsapp_access_token}
                onChange={(e) => onSecretsChange({ ...secrets, whatsapp_access_token: e.target.value })}
                className="pl-10 border-red-200 focus-visible:ring-red-500"
                placeholder="Enter WhatsApp Access Token"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              The permanent access token for the WhatsApp Business API
            </p>
          </div>

          <div>
            <Label htmlFor="groq_api_key" className="text-red-500">Groq API Key</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-3 h-4 w-4 text-red-400" />
              <Input
                id="groq_api_key"
                type="password"
                value={secrets.groq_api_key || ""}
                onChange={(e) => onSecretsChange({ ...secrets, groq_api_key: e.target.value })}
                className="pl-10 border-red-200 focus-visible:ring-red-500"
                placeholder="Enter Groq API Key (Optional)"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Optional: API key for Groq AI service
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
