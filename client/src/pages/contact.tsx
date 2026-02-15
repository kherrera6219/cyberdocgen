import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Mail, MapPin, MessageSquare, Send, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicHeader";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      company: formData.get("company") as string,
      subject: subject,
      message: formData.get("message") as string,
    };
    
    try {
      const response = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit form");
      }
      
      setSubmitted(true);
      toast({
        title: "Message sent",
        description: "We'll get back to you within 24 hours.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Mail, title: "Email", value: "CEO@lucentry.ai", link: "mailto:CEO@lucentry.ai" },
    { icon: MapPin, title: "Location", value: "Sacramento, CA", link: null },
    { icon: Clock, title: "Response Time", value: "Within 24 hours", link: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicHeader />

      {/* Hero Section */}
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">Contact</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about CyberDocGen? Our team is here to help you find the right solution for your compliance needs.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
              
              {/* Company Card */}
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 shadow-sm mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-bold text-foreground">Lucentry.AI</p>
                      <p className="text-sm text-muted-foreground">CyberDocGen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      {item.link ? (
                        <a href={item.link} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link href="/pricing" className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400">
                    <MessageSquare className="h-4 w-4" />
                    <span>View Pricing Plans</span>
                  </Link>
                  <Link href="/features" className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400">
                    <MessageSquare className="h-4 w-4" />
                    <span>Explore Features</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-card shadow-lg">
                <CardHeader>
                  <CardTitle className="text-foreground">Send us a message</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="mx-auto mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
                        <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <Button onClick={() => setSubmitted(false)} variant="outline">
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" name="firstName" required placeholder="John" data-testid="input-first-name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" name="lastName" required placeholder="Doe" data-testid="input-last-name" />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email">Work Email</Label>
                          <Input id="email" name="email" type="email" required placeholder="john@company.com" data-testid="input-email" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input id="company" name="company" required placeholder="Acme Inc." data-testid="input-company" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">How can we help?</Label>
                        <Select required value={subject} onValueChange={setSubject}>
                          <SelectTrigger id="subject" data-testid="select-subject">
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">Request a Demo</SelectItem>
                            <SelectItem value="beta">Beta Access</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message"
                          name="message"
                          required 
                          placeholder="Tell us more about your compliance needs..."
                          className="min-h-[150px]"
                          data-testid="input-message"
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-contact">
                        {isSubmitting ? (
                          <>Sending...</>
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

