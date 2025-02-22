
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface SecuritySectionProps {
  onUpdatePassword: () => void;
}

export const SecuritySection = ({ onUpdatePassword }: SecuritySectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Manage your password and security settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">Password</div>
            <div className="text-sm text-slate-500">
              Update your password to keep your account secure
            </div>
          </div>
          <Button
            onClick={onUpdatePassword}
            variant="outline"
            className="flex items-center"
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
