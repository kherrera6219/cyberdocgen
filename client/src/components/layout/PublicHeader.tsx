import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Menu, X } from "lucide-react";
import { TemporaryLoginDialog } from "@/components/TemporaryLoginDialog";

interface PublicHeaderProps {
  showBetaBadge?: boolean;
}

export function PublicHeader({ showBetaBadge = true }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

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
              {showBetaBadge && (
                <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
              )}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span 
                  data-testid={`nav-link-${link.href.slice(1)}`}
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    isActive(link.href) 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" data-testid="header-sign-in">
                Sign In
              </Button>
            </Link>
            <TemporaryLoginDialog 
              trigger={
                <Button data-testid="header-start-free">
                  Start Free
                </Button>
              }
            />
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span 
                    data-testid={`mobile-nav-link-${link.href.slice(1)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-sm font-medium rounded-md ${
                      isActive(link.href)
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <TemporaryLoginDialog 
                  trigger={<Button className="w-full">Start Free</Button>}
                />
                <Link href="/login">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">CyberDocGen</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Enterprise-grade compliance automation powered by AI. A product of Lucentry.ai LLC.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/features"><span className="hover:text-white transition-colors cursor-pointer">Features</span></Link></li>
              <li><Link href="/pricing"><span className="hover:text-white transition-colors cursor-pointer">Pricing</span></Link></li>
              <li><Link href="/about"><span className="hover:text-white transition-colors cursor-pointer">About</span></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Frameworks</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">ISO 27001</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">SOC 2</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">FedRAMP</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">NIST 800-53</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy"><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></Link></li>
              <li><Link href="/terms"><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></Link></li>
              <li><Link href="/contact"><span className="hover:text-white transition-colors cursor-pointer">Contact</span></Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Lucentry.ai LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="mailto:CEO@lucentry.ai" className="hover:text-white transition-colors">CEO@lucentry.ai</a>
            <span>Sacramento, CA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
