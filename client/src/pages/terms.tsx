import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";

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
                CyberDocGen
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">Features</span></Link>
            <Link href="/pricing"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">Pricing</span></Link>
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
              <Link href="/pricing"><span className="block px-3 py-2 text-sm font-medium">Pricing</span></Link>
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
            <span className="font-bold">CyberDocGen</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
            <Link href="/terms"><span className="text-white cursor-pointer">Terms</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link>
          </div>
          <p className="text-gray-400 text-sm">2025 CyberDocGen by Lucentry.ai LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Terms() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      <div className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-12">Last updated: December 2024</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 dark:text-gray-300">
                By accessing or using CyberDocGen's services, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access our services. These Terms apply to all visitors, users, and others who access or use our platform.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                CyberDocGen provides an AI-powered compliance automation platform that helps organizations:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Generate compliance documentation for various frameworks</li>
                <li>Manage and track compliance requirements</li>
                <li>Collaborate on compliance activities</li>
                <li>Prepare for security audits</li>
                <li>Monitor continuous compliance status</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Account Registration</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To use our services, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Acceptable Use</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Use our services for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
                <li>Upload malicious code or content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Share account credentials with unauthorized users</li>
                <li>Use automated systems to access our services without permission</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Intellectual Property</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                <strong>Our Content:</strong> The CyberDocGen platform, including its design, features, and content, is owned by CyberDocGen and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Your Content:</strong> You retain ownership of any content you upload to our platform. By uploading content, you grant us a limited license to use, store, and process that content solely to provide our services to you.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. AI-Generated Content</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our platform uses artificial intelligence to generate compliance documentation. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>AI-generated content should be reviewed by qualified professionals</li>
                <li>Generated documents may require customization for your specific needs</li>
                <li>CyberDocGen does not guarantee that generated content meets all regulatory requirements</li>
                <li>You are responsible for ensuring compliance with applicable laws and standards</li>
                <li>AI outputs should not be considered legal or professional advice</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Subscription and Payment</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Paid subscriptions are billed in advance on a monthly or annual basis. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Pay all fees according to your selected plan</li>
                <li>Provide valid payment information</li>
                <li>Accept automatic renewal unless cancelled</li>
                <li>Notify us of any billing disputes within 30 days</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                We offer a 30-day money-back guarantee for annual subscriptions. Refunds are not available for monthly subscriptions or after the 30-day period.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 dark:text-gray-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMPLIANCEAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF OUR SERVICES.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-600 dark:text-gray-300">
                OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Indemnification</h2>
              <p className="text-gray-600 dark:text-gray-300">
                You agree to indemnify and hold harmless CyberDocGen and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your use of our services, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Termination</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use our services will cease immediately. You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Governing Law</h2>
              <p className="text-gray-600 dark:text-gray-300">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the state or federal courts located in San Francisco County, California.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Changes to Terms</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">14. Contact Information</h2>
              <p className="text-gray-600 dark:text-gray-300">
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul className="list-none text-gray-600 dark:text-gray-300 mt-4 space-y-2">
                <li>Email: CEO@lucentry.ai</li>
                <li>Address: Sacramento, CA</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
