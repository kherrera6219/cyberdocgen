import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Target, Heart, Lightbulb, Users, Award, ArrowRight, Menu, X } from "lucide-react";
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
            <Link href="/pricing"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">Pricing</span></Link>
            <Link href="/about"><span className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer">About</span></Link>
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
              <Link href="/pricing"><span className="block px-3 py-2 text-sm font-medium">Pricing</span></Link>
              <Link href="/about"><span className="block px-3 py-2 text-sm font-medium text-blue-600">About</span></Link>
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

  const team = [
    { name: "Alex Thompson", role: "CEO & Co-Founder", background: "Former CISO at Fortune 500" },
    { name: "Dr. Sarah Kim", role: "CTO & Co-Founder", background: "AI Research at Stanford" },
    { name: "Marcus Chen", role: "VP of Engineering", background: "Ex-Google, Security Lead" },
    { name: "Emily Rodriguez", role: "VP of Compliance", background: "Former Big 4 Auditor" },
    { name: "David Park", role: "Head of Product", background: "Product at Okta" },
    { name: "Lisa Wang", role: "Head of Customer Success", background: "Customer Success at Datadog" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About ComplianceAI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            We're building the future of compliance automation, helping organizations achieve and maintain security certifications faster than ever before.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16 bg-white dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert mx-auto text-gray-600 dark:text-gray-300">
            <p className="mb-6">
              ComplianceAI was founded in 2022 by a team of security professionals and AI researchers who experienced firsthand the challenges of achieving compliance certifications. After spending countless hours manually creating documentation and preparing for audits, we knew there had to be a better way.
            </p>
            <p className="mb-6">
              We combined our expertise in cybersecurity, compliance frameworks, and artificial intelligence to create a platform that automates the most tedious aspects of compliance work. Our AI understands the nuances of different frameworks and can generate documentation that's tailored to each organization's unique context.
            </p>
            <p>
              Today, ComplianceAI helps over 500 organizations worldwide streamline their compliance journey, reducing preparation time by up to 80% while improving documentation quality and audit outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800 shadow-sm text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit">
                    <value.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">Leadership Team</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Our team combines deep expertise in cybersecurity, compliance, and AI technology.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                  <p className="text-blue-600 dark:text-blue-400 text-sm mb-2">{member.role}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{member.background}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-300">Enterprise Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">Team Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">$25M</div>
              <div className="text-gray-600 dark:text-gray-300">Funding Raised</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">4</div>
              <div className="text-gray-600 dark:text-gray-300">Global Offices</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-6">Join Our Mission</h2>
          <p className="text-xl text-blue-100 mb-8">
            We're always looking for talented individuals who share our passion for security and innovation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => window.location.href = '/api/login'} data-testid="button-get-started">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" data-testid="button-view-careers">
                View Careers
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
