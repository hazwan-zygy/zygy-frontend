import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PDFViewerPage from "@/pages/pdf-viewer";
import NotFound from "@/pages/not-found";
import LoginPage from "./pages/login";
import { Auth0ProviderWithNavigate } from "./auth/auth0-provider-with-navigation";
import { withAuthGuard } from "./auth/with-auth-guard";
import ApplicationPage from "./pages/ApplicationPage";

// New component to handle document redirect
function DocumentRedirect() {
  const [, params] = useRoute("/documents/:docId");
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (params?.docId) {
      navigate(`/documents/${params.docId}/page/1`, { replace: true });
    }
  }, [params, navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading document...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/applications" component={ApplicationPage} />
      <Route path="/documents/:docId" component={DocumentRedirect} />
      <Route path="/documents/:docId/page/:pageNum" component={PDFViewerPage} />
      <Route path="/" component={ApplicationPage} />
      <Route path="/upload" component={PDFViewerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Auth0ProviderWithNavigate>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </Auth0ProviderWithNavigate>
  );
}

export default App;