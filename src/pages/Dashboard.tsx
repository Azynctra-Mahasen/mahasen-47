
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Facebook, Instagram, FileText, Network, Ticket } from "lucide-react";
import { PlatformCard } from "@/components/dashboard/PlatformCard";
import { UtilityCard } from "@/components/dashboard/UtilityCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { toast } from "sonner";

const platforms = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageSquare,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip onboarding check - let users stay on the dashboard regardless of their configuration
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      setUserName(session.user.email?.split('@')[0] || "User");
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserName(session.user.email?.split('@')[0] || "User");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    navigate(`/chats/${platformId}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader
          userName={userName}
          onNavigate={navigate}
          onSignOut={handleSignOut}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {platforms.map((platform) => (
            <div key={platform.id} className="w-full">
              <PlatformCard
                {...platform}
                description={`Manage your ${platform.name} conversations`}
                isSelected={selectedPlatform === platform.id}
                onSelect={handlePlatformSelect}
                useShine={platform.id === "whatsapp"}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="w-full">
            <UtilityCard
              icon={FileText}
              title="Knowledge Base"
              description="Manage your uploaded files and documents"
              buttonText="Manage Files"
              onClick={() => navigate("/knowledge-base")}
              colorClass="text-purple-600"
              bgColorClass="bg-purple-50 dark:bg-purple-950/20"
              useShine={true}
            />
          </div>

          <div className="w-full">
            <UtilityCard
              icon={Network}
              title="Agent Flow"
              description="Design and manage your agent workflows"
              buttonText="Setup Agents"
              onClick={() => navigate("/agent-flow")}
              colorClass="text-indigo-600"
              bgColorClass="bg-indigo-50 dark:bg-indigo-950/20"
            />
          </div>

          <div className="w-full">
            <UtilityCard
              icon={Ticket}
              title="Tickets"
              description="Manage customer support tickets"
              buttonText="View Tickets"
              onClick={() => navigate("/tickets")}
              colorClass="text-orange-600"
              bgColorClass="bg-orange-50 dark:bg-orange-950/20"
              useShine={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
