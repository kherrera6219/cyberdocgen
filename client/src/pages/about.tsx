import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Target, Heart, Lightbulb, ArrowRight, Mail, MapPin, Building2 } from "lucide-react";
import { useEffect } from "react";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicHeader";

export default function About() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const values = [
    { icon: Target, title: "Mission-Driven", description: "We're on a mission to make security compliance accessible to every organization, regardless of size or resources." },
    { icon: Heart, title: "Customer-Centric", description: "Every feature we build starts with understanding our customers' real compliance challenges and pain points." },
    { icon: Lightbulb, title: "Innovation", description: "We leverage cutting-edge AI technology to automate what was previously manual and time-consuming." },
    { icon: Shield, title: "Security First", description: "We practice what we preach - our platform is built with security and compliance at its core." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicHeader />

      {/* Hero Section */}
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">About Us</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About CyberDocGen
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're building the future of compliance automation, helping organizations achieve and maintain security certifications faster than ever before.
          </p>
        </div>
      </div>

      {/* Company Info Section */}
      <div className="py-16 bg-card/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Lucentry.AI</h2>
                  <p className="text-muted-foreground">The company behind CyberDocGen</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-muted-foreground">Sacramento, CA, United States</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Contact</p>
                    <a href="mailto:CEO@lucentry.ai" className="text-blue-600 dark:text-blue-400 hover:underline">CEO@lucentry.ai</a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground">
            <p className="mb-6">
              CyberDocGen was born from a simple observation: security compliance is too complex, too time-consuming, and too expensive for most organizations. We set out to change that.
            </p>
            <p className="mb-6">
              By combining our expertise in cybersecurity, compliance frameworks, and artificial intelligence, we created a platform that automates the most tedious aspects of compliance work. Our multi-model AI system leverages GPT-5.1, Claude Opus 4.5, and Gemini 3.0 Pro to generate documentation that's tailored to each organization's unique context.
            </p>
            <p>
              Today, CyberDocGen is in beta, helping organizations streamline their compliance journey. We're continuously improving our platform based on user feedback and are committed to making enterprise-grade compliance accessible to everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 bg-card shadow-sm text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit">
                    <value.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Beta Status Section */}
      <div className="py-16 bg-card/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">Current Status</Badge>
          <h2 className="text-3xl font-bold text-foreground mb-6">Currently in Beta</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            CyberDocGen is actively being developed and refined. We're working closely with our beta users to build the best compliance automation platform possible. Your feedback helps shape the future of our product.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 bg-gray-50 dark:bg-gray-800 shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Beta</p>
                <p className="text-muted-foreground text-sm">Current Phase</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gray-50 dark:bg-gray-800 shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Free</p>
                <p className="text-muted-foreground text-sm">During Beta</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gray-50 dark:bg-gray-800 shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Active</p>
                <p className="text-muted-foreground text-sm">Development</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-6">Join Our Beta Program</h2>
          <p className="text-xl text-blue-100 mb-8">
            Be part of the future of compliance automation. Get free access during our beta period and help shape the product.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100" data-testid="button-get-started">
              <Link href="/login">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10" data-testid="button-contact">
              <Link href="/contact">
                Request Beta Access
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

