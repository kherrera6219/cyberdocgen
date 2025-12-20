import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, ArrowRight, Zap, HelpCircle, Mail, MapPin, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="font-bold">CyberDocGen</span>
            <Badge variant="outline" className="ml-2 border-gray-600 text-gray-400 text-xs">Beta</Badge>
          </div>
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm">A product of Lucentry.ai LLC</p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> CEO@lucentry.ai</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Sacramento, CA</span>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link>
          </div>
          <p className="text-gray-400 text-sm">2025 Lucentry.ai LLC</p>
        </div>
      </div>
    </footer>
  );
}

export default function Pricing() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started with compliance",
      features: [
        "1 compliance framework",
        "Up to 5 team members",
        "AI document generation",
        "Basic gap analysis",
        "Email support",
        "Standard templates",
      ],
      popular: false,
    },
    {
      name: "Professional",
      description: "For growing organizations with multiple compliance needs",
      features: [
        "3 compliance frameworks",
        "Up to 20 team members",
        "Unlimited AI generation",
        "Advanced gap analysis",
        "Priority support",
        "Custom templates",
        "Approval workflows",
        "Auditor workspace",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations with advanced requirements",
      features: [
        "Unlimited frameworks",
        "Unlimited team members",
        "Unlimited AI generation",
        "Full gap analysis suite",
        "24/7 dedicated support",
        "Custom templates",
        "Advanced workflows",
        "Auditor workspace",
        "SSO & SCIM",
        "Custom integrations",
        "Dedicated account manager",
      ],
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "Is CyberDocGen free during beta?",
      answer: "Yes! During the beta period, all features are available free of charge. We'll notify beta users before transitioning to paid plans."
    },
    {
      question: "When will pricing be available?",
      answer: "Pricing will be announced when we launch out of beta. Beta users will receive special early-adopter pricing."
    },
    {
      question: "What AI models are included?",
      answer: "All plans include access to GPT-5.1, Claude Opus 4.5, and Gemini 3.0 Pro with intelligent model routing."
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can export all your documents and data at any time in standard formats."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use AES-256 encryption, multi-factor authentication, and role-based access controls."
    },
    {
      question: "How do I get beta access?",
      answer: "Contact us at CEO@lucentry.ai to request beta access. We're accepting new users on a rolling basis."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicHeader />

      {/* Hero Section */}
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            Free During Beta
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Pricing Coming Soon
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            CyberDocGen is currently in beta. All features are available free during the beta period. 
            Join now to lock in early-adopter pricing when we launch.
          </p>

          <Link href="/contact">
            <Button size="lg" data-testid="button-request-beta">
              Contact Us for Beta Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Pricing Cards - Coming Soon */}
      <div className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-0 shadow-lg ${plan.popular ? 'ring-2 ring-blue-600 dark:ring-blue-400' : ''} bg-white dark:bg-gray-800`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                      <Zap className="h-4 w-4" />
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      Coming Soon
                    </Badge>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Free during beta
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/contact">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      data-testid={`button-${plan.name.toLowerCase()}-cta`}
                    >
                      Contact for Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="py-16 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">Starter</th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">Professional</th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: "Team members", starter: "5", pro: "20", enterprise: "Unlimited" },
                  { feature: "Compliance frameworks", starter: "1", pro: "3", enterprise: "Unlimited" },
                  { feature: "AI generations/month", starter: "50", pro: "500", enterprise: "Unlimited" },
                  { feature: "AI Models (GPT-5.1, Claude, Gemini)", starter: "Yes", pro: "Yes", enterprise: "Yes" },
                  { feature: "Document storage", starter: "10 GB", pro: "100 GB", enterprise: "Unlimited" },
                  { feature: "Gap analysis", starter: "Basic", pro: "Advanced", enterprise: "Full suite" },
                  { feature: "Approval workflows", starter: "-", pro: "Yes", enterprise: "Yes" },
                  { feature: "Auditor workspace", starter: "-", pro: "Yes", enterprise: "Yes" },
                  { feature: "Custom templates", starter: "-", pro: "Yes", enterprise: "Yes" },
                  { feature: "SSO / SCIM", starter: "-", pro: "-", enterprise: "Yes" },
                  { feature: "API access", starter: "-", pro: "Yes", enterprise: "Yes" },
                  { feature: "Support", starter: "Email", pro: "Priority", enterprise: "24/7 Dedicated" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-300">{row.starter === "-" ? <span className="text-gray-400">-</span> : row.starter}</td>
                    <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-300">{row.pro === "-" ? <span className="text-gray-400">-</span> : row.pro}</td>
                    <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-300">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Beta Program</Badge>
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our beta program today and get free access to all features. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" data-testid="button-start-trial-footer">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" data-testid="button-contact-sales-footer">
                Request Beta Access
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
