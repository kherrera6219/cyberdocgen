import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, ArrowRight, Menu, X, Zap, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ComplianceAI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">Features</span></Link>
            <Link href="/pricing"><span className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer">Pricing</span></Link>
            <Link href="/about"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">About</span></Link>
            <Link href="/contact"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">Contact</span></Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
            <Button onClick={() => window.location.href = '/api/login'}>Get Started</Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-3">
              <Link href="/features"><span className="block px-3 py-2 text-sm font-medium">Features</span></Link>
              <Link href="/pricing"><span className="block px-3 py-2 text-sm font-medium text-blue-600">Pricing</span></Link>
              <Link href="/about"><span className="block px-3 py-2 text-sm font-medium">About</span></Link>
              <Link href="/contact"><span className="block px-3 py-2 text-sm font-medium">Contact</span></Link>
              <div className="flex flex-col gap-2 pt-3 border-t">
                <Link href="/login"><Button variant="outline">Sign In</Button></Link>
                <Button onClick={() => window.location.href = '/api/login'}>Get Started</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="font-bold">ComplianceAI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link>
          </div>
          <p className="text-gray-400 text-sm">2024 ComplianceAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

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
      monthlyPrice: 299,
      annualPrice: 249,
      features: [
        "1 compliance framework",
        "Up to 5 team members",
        "AI document generation (50/mo)",
        "Basic gap analysis",
        "Email support",
        "Standard templates",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      description: "For growing organizations with multiple compliance needs",
      monthlyPrice: 799,
      annualPrice: 649,
      features: [
        "3 compliance frameworks",
        "Up to 20 team members",
        "AI document generation (200/mo)",
        "Advanced gap analysis",
        "Priority support",
        "Custom templates",
        "Approval workflows",
        "Auditor workspace",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations with advanced requirements",
      monthlyPrice: null,
      annualPrice: null,
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
      cta: "Contact Sales",
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "What's included in the free trial?",
      answer: "The 14-day free trial includes full access to all features in your selected plan. No credit card required to start."
    },
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle."
    },
    {
      question: "Do you offer discounts for nonprofits?",
      answer: "Yes, we offer special pricing for nonprofits, educational institutions, and startups. Contact our sales team for details."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "You can export all your data before cancellation. We retain data for 30 days after cancellation in case you change your mind."
    },
    {
      question: "Is there a setup fee?",
      answer: "No, there are no setup fees for Starter or Professional plans. Enterprise plans may include implementation services."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for annual subscriptions if you're not satisfied with the service."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your organization's compliance needs. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              data-testid="toggle-billing-period"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Annual
              <span className="ml-1 text-green-600 dark:text-green-400">(Save 20%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
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
                    {plan.monthlyPrice !== null ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">/month</span>
                        {isAnnual && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Billed annually (${plan.annualPrice! * 12}/year)
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">Custom</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => plan.monthlyPrice !== null ? window.location.href = '/api/login' : window.location.href = '/contact'}
                    data-testid={`button-${plan.name.toLowerCase()}-cta`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
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
                  { feature: "AI generations/month", starter: "50", pro: "200", enterprise: "Unlimited" },
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
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => window.location.href = '/api/login'} data-testid="button-start-trial-footer">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" data-testid="button-contact-sales-footer">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
