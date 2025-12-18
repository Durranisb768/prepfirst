import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  BookOpen, 
  Menu, 
  X, 
  LayoutDashboard,
  FileText,
  PenTool,
  MessageSquare,
  CreditCard
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/study-planner", label: "Study Planner", icon: BookOpen },
  { href: "/article-analyzer", label: "Article Analyzer", icon: FileText },
  { href: "/essay-builder", label: "Essay Builder", icon: PenTool },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLanding = location === "/";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">CSS Insight Hub</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLanding && (
              <>
                <Link href="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" data-testid="button-sign-in">Sign In</Button>
                </Link>
                <Link href="/dashboard">
                  <Button data-testid="button-get-started">Get Started</Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
