import { Link } from "wouter";
import { BookOpen, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg">CSS Insight Hub</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your AI-powered companion for CSS exam preparation. Master the exam with intelligent tools and personalized guidance.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-dashboard">
                Dashboard
              </Link>
              <Link href="/study-planner" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-study-planner">
                Study Planner
              </Link>
              <Link href="/article-analyzer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-article-analyzer">
                Article Analyzer
              </Link>
              <Link href="/essay-builder" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-essay-builder">
                Essay Builder
              </Link>
              <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-pricing">
                Pricing
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+923040644768</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span>contact@cssinsighthub.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Pakistan</span>
              </div>
              <p className="text-sm font-medium text-foreground pt-1">
                Mudassar Ali
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Newsletter</h4>
            <p className="text-sm text-muted-foreground">
              Subscribe for CSS exam tips and updates.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                data-testid="input-newsletter-email"
              />
              <Button type="submit" data-testid="button-subscribe">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CSS Insight Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
