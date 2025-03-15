
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PlatformChats from "./pages/PlatformChats";
import ChatConversation from "./pages/ChatConversation";
import About from "./pages/About";
import KnowledgeBase from "./pages/KnowledgeBase";
import AISettings from "./pages/AISettings";
import AgentFlow from "./pages/AgentFlow";
import Tickets from "./pages/Tickets";
import CompletedTickets from "./pages/CompletedTickets";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      networkMode: "always",
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            setIsAuthenticated(false);
            queryClient.clear();
            
            // Only show error toast for critical errors, not token refresh issues
            if (error.message !== "Invalid Refresh Token: Refresh Token Not Found" && 
                !error.message.includes("refresh token")) {
              toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Please try logging in again.",
              });
            }
          }
          return;
        }
        
        if (mounted) {
          setIsAuthenticated(!!session);
          if (!session) {
            queryClient.clear();
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) {
          setIsAuthenticated(false);
          queryClient.clear();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log("Auth state changed:", event);
        
        switch (event) {
          case 'SIGNED_OUT':
            setIsAuthenticated(false);
            queryClient.clear();
            toast({
              title: "Signed Out",
              description: "You have been signed out successfully.",
            });
            break;
          case 'TOKEN_REFRESHED':
            console.log('Session token refreshed successfully');
            setIsAuthenticated(true);
            break;
          case 'SIGNED_IN':
            console.log('User signed in successfully');
            setIsAuthenticated(true);
            break;
          case 'USER_UPDATED':
            console.log('User data updated');
            setIsAuthenticated(!!session);
            break;
          default:
            // Don't change auth state for other events unless we have session data
            if (session !== null) {
              setIsAuthenticated(!!session);
            }
            break;
        }
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />
              <Route
                path="/signup"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
                }
              />
              <Route path="/about" element={<About />} />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/onboarding"
                element={
                  isAuthenticated ? (
                    <Onboarding />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/settings"
                element={
                  isAuthenticated ? (
                    <Settings />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/knowledge-base"
                element={
                  isAuthenticated ? (
                    <KnowledgeBase />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/agent-flow"
                element={
                  isAuthenticated ? (
                    <AgentFlow />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/tickets"
                element={
                  isAuthenticated ? (
                    <Tickets />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/completed-tickets"
                element={
                  isAuthenticated ? (
                    <CompletedTickets />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/ai-settings"
                element={
                  isAuthenticated ? (
                    <AISettings />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/chats/:platform"
                element={
                  isAuthenticated ? (
                    <PlatformChats />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/chat/:id"
                element={
                  isAuthenticated ? (
                    <ChatConversation />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
