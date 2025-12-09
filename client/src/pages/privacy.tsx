import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";

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
            <span className="font-bold">ComplianceAI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy"><span className="text-white cursor-pointer">Privacy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link>
          </div>
          <p className="text-gray-400 text-sm">2024 ComplianceAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Privacy() {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-12">Last updated: December 2024</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                ComplianceAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our compliance automation platform and related services.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                By using ComplianceAI, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li>Account information (name, email address, company name, job title)</li>
                <li>Payment information (processed securely through our payment providers)</li>
                <li>Compliance documentation and organizational data you input into our platform</li>
                <li>Communications with our support team</li>
                <li>Survey responses and feedback</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Device information (browser type, operating system, device identifiers)</li>
                <li>Usage data (features used, pages visited, actions taken)</li>
                <li>Log data (IP address, access times, error logs)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Personalize and improve your experience</li>
                <li>Train and improve our AI models (using anonymized and aggregated data only)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Multi-factor authentication options</li>
                <li>Regular security audits and penetration testing</li>
                <li>SOC 2 Type II certification</li>
                <li>Role-based access controls</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>With service providers who assist in our operations</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With your consent or at your direction</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your data at any time by contacting our support team.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Your Rights</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict processing of your information</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. International Data Transfers</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information, including Standard Contractual Clauses approved by the European Commission.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Contact Us</h2>
              <p className="text-gray-600 dark:text-gray-300">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-none text-gray-600 dark:text-gray-300 mt-4 space-y-2">
                <li>Email: privacy@complianceai.com</li>
                <li>Address: 123 Market Street, Suite 500, San Francisco, CA 94105</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
