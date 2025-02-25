import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { Check, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { cn } from "@/lib/utils";

const PricingCard = ({
  title,
  price,
  description,
  features,
  isPopular,
  yearlyPrice,
  isAnnual,
  secondaryInfo,
}: {
  title: string;
  price: string;
  description: string;
  features: Array<{ text: string; included: boolean }>;
  isPopular?: boolean;
  yearlyPrice?: string;
  isAnnual: boolean;
  secondaryInfo?: string;
}) => (
  <Card className={`relative h-full ${isPopular ? 'border-2 border-primary shadow-lg scale-105' : ''} transition-all duration-300 hover:shadow-xl`}>
    <div className="p-6 h-full flex flex-col">
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="bg-primary text-primary-foreground px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      <div className="text-center mb-6 flex-none">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="mb-2 relative">
          {isAnnual && price !== 'Custom' && (
            <div className="absolute -top-4 right-0 left-0">
              <span className="text-sm line-through text-muted-foreground">${parseInt(price.replace('$', '')) + 4}/mo</span>
            </div>
          )}
          <span className="text-4xl font-bold">{isAnnual && yearlyPrice ? yearlyPrice : price}</span>
          {price !== 'Custom' && (
            <span className="text-muted-foreground text-lg">/month</span>
          )}
        </div>
        {secondaryInfo && (
          <p className="text-sm text-muted-foreground mt-1">{secondaryInfo}</p>
        )}
      </div>

      <div className="space-y-4 mb-8 flex-grow">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-none">
        <Button 
          className="w-full" 
          variant={isPopular ? "default" : "outline"}
          size="lg"
          onClick={() => window.open("https://wa.me/message/TTJHEFNWX2KKF1", "_blank")}
        >
          {price === 'Custom' ? 'Contact Sales' : 'Get Started'}
        </Button>
        {price !== 'Custom' && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            No credit card required
          </p>
        )}
      </div>
    </div>
  </Card>
);

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      title: "Starter",
      price: "$17",
      yearlyPrice: "$13",
      description: "Perfect for small businesses just getting started",
      features: [
        { text: "Up to 500 messages/month", included: true },
        { text: "2 social media platforms", included: true },
        { text: "Basic AI responses", included: true },
        { text: "Email support", included: true },
        { text: "1 team member", included: true },
        { text: "Knowledge base integration", included: false },
        { text: "Custom AI training", included: false },
        { text: "Priority support", included: false }
      ],
      secondaryInfo: isAnnual ? "Save $48 annually" : undefined
    },
    {
      title: "Professional",
      price: "$99",
      yearlyPrice: "$79",
      description: "Ideal for growing businesses",
      features: [
        { text: "Up to 5,000 messages/month", included: true },
        { text: "All social media platforms", included: true },
        { text: "Advanced AI with custom training", included: true },
        { text: "Priority support", included: true },
        { text: "5 team members", included: true },
        { text: "Knowledge base integration", included: true },
        { text: "Analytics dashboard", included: true },
        { text: "Custom integrations", included: false }
      ],
      isPopular: true,
      secondaryInfo: isAnnual ? "Save $240 annually" : undefined
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "For large organizations with custom needs",
      features: [
        { text: "Unlimited messages", included: true },
        { text: "All platforms + API access", included: true },
        { text: "Custom AI model training", included: true },
        { text: "24/7 dedicated support", included: true },
        { text: "Unlimited team members", included: true },
        { text: "Advanced analytics & reporting", included: true },
        { text: "Custom integrations", included: true },
        { text: "Dedicated account manager", included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="relative z-10 mb-4 inline-block">
              <Badge variant="outline" className="p-0">
                <AnimatedGradientText>
                  <span className={cn(
                    "inline-flex items-center px-4 py-1",
                    "bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40]",
                    "bg-clip-text text-transparent",
                    "font-medium"
                  )}>
                    Elevate your Business
                    <ChevronRight className="ml-1 h-4 w-4 text-[#9c40ff] transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                  </span>
                </AnimatedGradientText>
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Choose the plan that's right for your business. All plans include a 14-day free trial.
            </p>
            
            <div className="inline-flex items-center justify-center gap-3 p-1 bg-muted rounded-full mb-12">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full transition-all ${
                  !isAnnual 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full transition-all ${
                  isAnnual 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annually (-20%)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard 
                key={index} 
                {...plan} 
                isAnnual={isAnnual}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto text-left grid gap-6 mt-8">
              <div>
                <h3 className="font-medium mb-2">Can I switch plans later?</h3>
                <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Prorated charges will be applied to your next billing cycle.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">What happens after my trial ends?</h3>
                <p className="text-muted-foreground">After your 14-day trial, you'll be automatically switched to your selected plan. Don't worry - we'll send you a reminder before this happens.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Do you offer custom solutions?</h3>
                <p className="text-muted-foreground">Yes! Our Enterprise plan can be customized to your specific needs. Contact our sales team to discuss your requirements.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
