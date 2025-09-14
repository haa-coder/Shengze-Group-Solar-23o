import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";

// Lazy load components for better performance
const Home = lazy(() => import("@/pages/home"));
const Products = lazy(() => import("@/pages/products"));
const DatasheetPage = lazy(() => import("@/pages/datasheet"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Preload components for instant navigation
const preloadComponents = () => {
  // Preload most common pages after initial load
  setTimeout(() => {
    import("@/pages/products");
    import("@/pages/home");
  }, 100);
};

// Loading component for instant feel
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    preloadComponents();
  }, []);

  // Disable scroll restoration and handle route changes
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Only scroll to top if there's no section parameter
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    
    if (!sectionParam) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/datasheet/:filename" component={DatasheetPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
