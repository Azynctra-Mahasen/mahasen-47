
import { AISettingsHeader } from "@/components/ai-settings/AISettingsHeader";
import { AISettingsActions } from "@/components/ai-settings/AISettingsActions";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { PlatformsSection } from "@/components/settings/PlatformsSection";
import { SecretsSection } from "@/components/settings/SecretsSection";
import { useProfile } from "@/hooks/useProfile";
import { useProfileActions } from "@/hooks/useProfileActions";
import { useSettingsSubmit } from "@/hooks/useSettingsSubmit";

const Settings = () => {
  const {
    loading,
    setLoading,
    username,
    setUsername,
    email,
    whatsappNumber,
    setWhatsappNumber,
    profileUrl,
    setProfileUrl,
    secrets,
    setSecrets
  } = useProfile();

  const { handleFileUpload, handleUpdatePassword } = useProfileActions(
    setLoading,
    email,
    setProfileUrl,
    profileUrl
  );

  const { handleSave: handleSubmit } = useSettingsSubmit();

  const handleSave = () => {
    handleSubmit(setLoading, username, whatsappNumber, secrets);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AISettingsHeader />
        
        <div className="space-y-6">
          <ProfileSection
            username={username}
            email={email}
            profileUrl={profileUrl}
            loading={loading}
            onUsernameChange={setUsername}
            onFileUpload={handleFileUpload}
          />

          <SecuritySection
            onUpdatePassword={handleUpdatePassword}
          />

          <PlatformsSection
            whatsappNumber={whatsappNumber}
            onWhatsappNumberChange={setWhatsappNumber}
          />

          <SecretsSection
            secrets={secrets}
            onSecretsChange={setSecrets}
          />

          <AISettingsActions
            onSave={handleSave}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
