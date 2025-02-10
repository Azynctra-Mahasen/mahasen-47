
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Navigation = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/6bdab8c7-96e8-4d13-84c2-8bf7b589255f.png" 
              alt="Mahasen AI" 
              className="h-8 cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/pricing")}
              className="text-foreground"
            >
              Pricing
            </Button>
            <ThemeToggle />
            <Button 
              onClick={() => window.open("https://wa.me/message/TTJHEFNWX2KKF1", "_blank")}
              className="text-primary-foreground"
            >
              Get Started
            </Button>
            <Button 
              onClick={() => navigate("/login")}
              className="text-primary-foreground"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
