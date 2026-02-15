import { PublicFooter, PublicHeader } from "@/components/layout/PublicHeader";

const LAST_UPDATED = "February 9, 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicHeader />

      <div className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using CyberDocGen's services, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access our services. These Terms apply to all visitors, users, and others who access or use our platform.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                CyberDocGen provides an AI-powered compliance automation platform that helps organizations:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Generate compliance documentation for various frameworks</li>
                <li>Manage and track compliance requirements</li>
                <li>Collaborate on compliance activities</li>
                <li>Prepare for security audits</li>
                <li>Monitor continuous compliance status</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground mb-4">
                To use our services, you must:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
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
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                <strong>Our Content:</strong> The CyberDocGen platform, including its design, features, and content, is owned by CyberDocGen and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
              </p>
              <p className="text-muted-foreground">
                <strong>Your Content:</strong> You retain ownership of any content you upload to our platform. By uploading content, you grant us a limited license to use, store, and process that content solely to provide our services to you.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. AI-Generated Content</h2>
              <p className="text-muted-foreground mb-4">
                Our platform uses artificial intelligence to generate compliance documentation. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>AI-generated content should be reviewed by qualified professionals</li>
                <li>Generated documents may require customization for your specific needs</li>
                <li>CyberDocGen does not guarantee that generated content meets all regulatory requirements</li>
                <li>You are responsible for ensuring compliance with applicable laws and standards</li>
                <li>AI outputs should not be considered legal or professional advice</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Subscription and Payment</h2>
              <p className="text-muted-foreground mb-4">
                Paid subscriptions are billed in advance on a monthly or annual basis. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Pay all fees according to your selected plan</li>
                <li>Provide valid payment information</li>
                <li>Accept automatic renewal unless cancelled</li>
                <li>Notify us of any billing disputes within 30 days</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We offer a 30-day money-back guarantee for annual subscriptions. Refunds are not available for monthly subscriptions or after the 30-day period.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMPLIANCEAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF OUR SERVICES.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless CyberDocGen and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your use of our services, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use our services will cease immediately. You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the state or federal courts located in San Francisco County, California.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">14. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul className="list-none text-muted-foreground mt-4 space-y-2">
                <li>Email: CEO@lucentry.ai</li>
                <li>Address: Sacramento, CA</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

