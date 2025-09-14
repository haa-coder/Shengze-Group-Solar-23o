import { useState, useEffect, memo, useCallback } from "react";
import { CloudSun, Menu, X } from "lucide-react";
import logoImage from "@assets/logo_1757446504015.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";

// Preload functions for instant navigation
const preloadPage = (pageName: string) => {
  switch (pageName) {
    case 'products':
      import('@/pages/products');
      break;
    case 'home':
      import('@/pages/home');
      break;
    case 'datasheet':
      import('@/pages/datasheet');
      break;
    default:
      break;
  }
};

const Navigation = memo(() => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    // If we're not on the home page, navigate to home first then scroll
    if (location !== '/') {
      setLocation(`/?section=${sectionId}`);
      setIsOpen(false);
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      // Precise navigation - account for fixed navigation bar (64px) + 20px padding
      const yOffset = -84;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsOpen(false);
  }, [location, setLocation]);

  // Preload on hover for instant navigation
  const handleLinkHover = useCallback((pageName: string) => {
    preloadPage(pageName);
  }, []);

  const navLinks = [
    { label: 'Home', id: 'home', href: '/' },
    { label: 'About', id: 'about' },
    { label: 'Products', id: 'products', href: '/products' },
    { label: 'Solar Energy', id: 'solar' },
    { label: 'Services', id: 'services' },
    { label: 'Calculator', id: 'calculator' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white/95 backdrop-blur-sm'
    }`} itemScope itemType="https://schema.org/SiteNavigationElement" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="flex items-center cursor-pointer" 
            itemProp="brand" 
            itemScope 
            itemType="https://schema.org/Brand"
            onMouseEnter={() => handleLinkHover('home')}
            aria-label="Navigate to home page"
          >
            <img 
              src={logoImage} 
              alt="Shengze Group Logo" 
              className="h-14 w-14 object-contain hover:scale-105 transition-transform duration-200 filter contrast-125 brightness-110" 
              style={{
                imageRendering: 'crisp-edges'
              } as React.CSSProperties}
              aria-hidden="true" 
              itemProp="logo" 
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6" role="menubar">
            {navLinks.map((link) => {
              if (link.href) {
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                    data-testid={`nav-${link.id}`}
                    role="menuitem"
                    aria-label={`Navigate to ${link.label} page`}
                    itemProp="url"
                    onMouseEnter={() => handleLinkHover(link.id)}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  data-testid={`nav-${link.id}`}
                  role="menuitem"
                  aria-label={`Navigate to ${link.label} section`}
                  itemProp="url"
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-trigger">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => {
                  if (link.href) {
                    return (
                      <Link
                        key={link.id}
                        href={link.href}
                        className="text-left text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        data-testid={`mobile-nav-${link.id}`}
                        onClick={() => setIsOpen(false)}
                        onTouchStart={() => handleLinkHover(link.id)}
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="text-left text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                      data-testid={`mobile-nav-${link.id}`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
