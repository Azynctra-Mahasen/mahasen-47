import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { Cover } from "@/components/ui/cover";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { TabsDemo } from "@/components/TabsDemo";

interface FeatureIcon {
  ({ className }: { className?: string }): JSX.Element;
}

interface Feature {
  title: string;
  description: string;
  icon: FeatureIcon;
}

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/6bdab8c7-96e8-4d13-84c2-8bf7b589255f.png" 
                alt="Mahasen AI" 
                className="h-8"
              />
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={() => navigate("/login")}
                className="text-foreground"
              >
                Sign in
              </Button>
              <Button 
                onClick={() => navigate("/signup")}
                className="text-primary-foreground"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Intelligent Customer Support
                <br />
                <Cover>Powered by AI</Cover>
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
                Manage all your customer conversations from WhatsApp, Facebook, and Instagram in one place.
                Respond faster, collaborate better.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <HoverBorderGradient
                onClick={() => navigate("/signup")}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white"
                containerClassName="rounded-md"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </HoverBorderGradient>
              <HoverBorderGradient
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-sm font-medium text-white"
                containerClassName="rounded-md"
              >
                Sign in
              </HoverBorderGradient>
            </div>
          </div>
        </section>

        <section className="py-24 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <CardContainer key={index}>
                  <CardBody className="bg-background relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] border-black/[0.1] w-full h-full rounded-xl p-6 border">
                    <CardItem translateZ="50" className="w-12 h-12 text-emerald-600 dark:text-emerald-500">
                      <feature.icon className="w-full h-full" />
                    </CardItem>
                    <CardItem
                      translateZ="60"
                      className="mt-4 text-xl font-semibold text-foreground"
                    >
                      {feature.title}
                    </CardItem>
                    <CardItem
                      as="p"
                      translateZ="80"
                      className="mt-2 text-muted-foreground"
                    >
                      {feature.description}
                    </CardItem>
                    <CardItem translateZ="100" className="w-full mt-4">
                      <img
                        src="https://ik.imagekit.io/ably/ghost/prod/2023/01/build-a-realtime-chat-app-from-scratch--1-.png?tr=w-1728,q-50"
                        className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                        alt="feature"
                      />
                    </CardItem>
                  </CardBody>
                </CardContainer>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Explore Our Features
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Discover how our platform can transform your customer support experience
              </p>
            </div>
            <TabsDemo />
          </div>
        </section>

      <footer className="border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              All Rights Reserved -  Azynctra 2025
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/about")}>
                About Us
              </Button>
              <div className="text-sm space-x-4 text-muted-foreground">
                <a 
                  href="https://geethikaisuru.notion.site/Aventis-Privacy-Policy-140671df8cf1809fb347e99502582345" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>
                <span>•</span>
                <a 
                  href="https://geethikaisuru.notion.site/Aventis-Terms-Of-Service-140671df8cf18036a04dc535bf2db052" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Terms & Conditions
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
};

const features: Feature[] = [
  {
    title: "Multi-Platform Integration",
    description: "Connect and manage WhatsApp, Facebook, and Instagram messages seamlessly.",
    icon: ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.115 5.19l.319 1.913A6 6.115 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64"
        />
      </svg>
    ),
  },
  {
    title: "Real-time Conversations",
    description: "Engage with customers in real-time across all connected platforms.",
    icon: ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
  },
  {
    title: "Smart Inbox",
    description: "Organize and prioritize conversations with our intelligent inbox system.",
    icon: ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
        />
      </svg>
    ),
  },
];

export default Index;
