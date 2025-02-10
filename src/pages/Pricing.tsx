
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingCard = ({
  title,
  price,
  description,
  features,
  isPopular,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}) => (
  <div className={`relative rounded-lg p-6 ${isPopular ? 'border-2 border-primary shadow-lg' : 'border'}`}>
    {isPopular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
          Most Popular
        </span>
      </div>
    )}
    <div className="text-center mb-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="mb-2">
        <span className="text-3xl font-bold">{price}</span>
        {price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
    <ul className="space-y-3 mb-6">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Button 
      className="w-full" 
      variant={isPopular ? "default" : "outline"}
      onClick={() => window.open("https://wa.me/message/TTJHEFNWX2KKF1", "_blank")}
    >
      Get Started
    </Button>
  </div>
);

const Pricing = () => {
  const plans = [
    {
      title: "Starter",
      price: "$29",
      description: "Perfect for small businesses just getting started",
      features: [
        "Up to 500 messages/month",
        "2 social media platforms",
        "Basic AI responses",
        "Email support",
        "1 team member"
      ]
    },
    {
      title: "Professional",
      price: "$99",
      description: "Ideal for growing businesses",
      features: [
        "Up to 5,000 messages/month",
        "All social media platforms",
        "Advanced AI with custom training",
        "Priority support",
        "5 team members",
        "Analytics dashboard"
      ],
      isPopular: true
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "For large organizations with custom needs",
      features: [
        "Unlimited messages",
        "All platforms + API access",
        "Custom AI model training",
        "24/7 dedicated support",
        "Unlimited team members",
        "Advanced analytics & reporting",
        "Custom integrations"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that's right for your business
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
