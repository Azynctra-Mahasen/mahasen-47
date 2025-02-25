
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const Signup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <Card className="w-full max-w-md relative border-slate-200/20 dark:border-slate-700/30 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Join Mahasen AI
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Create your account to start managing customer conversations efficiently
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#8B5CF6',
                    brandAccent: '#7C3AED',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#F8FAFC',
                    defaultButtonBackgroundHover: '#F1F5F9',
                    defaultButtonBorder: '#E2E8F0',
                    defaultButtonText: '#475569',
                    dividerBackground: '#E2E8F0',
                    inputBackground: 'transparent',
                    inputBorder: '#E2E8F0',
                    inputBorderFocus: '#8B5CF6',
                    inputBorderHover: '#CBD5E1',
                    inputPlaceholder: '#94A3B8',
                    messageText: '#475569',
                    messageTextDanger: '#DC2626',
                  },
                },
              },
              className: {
                button: 'hover:scale-[1.02] transform transition-transform duration-200',
                container: 'space-y-4',
                label: 'text-sm font-medium text-slate-700 dark:text-slate-300',
                input: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200',
                message: 'text-sm',
              },
            }}
            theme="default"
            providers={[]}
            redirectTo={`${window.location.origin}/dashboard`}
            view="sign_up"
            showLinks={false}
          />
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-200/20 dark:border-slate-700/30 pt-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300" 
              onClick={() => navigate("/login")}
            >
              Sign in here
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
