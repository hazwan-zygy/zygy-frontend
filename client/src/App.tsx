import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PDFViewerPage from "@/pages/pdf-viewer";
import NotFound from "@/pages/not-found";
import LoginPage from "./pages/login";
import { Auth0ProviderWithNavigate } from "./auth/auth0-provider-with-navigation";
import { withAuthGuard } from "./auth/with-auth-guard";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/documents/:docId/page/:pageNum" component={withAuthGuard(PDFViewerPage)} />
      <Route path="/" component={withAuthGuard(PDFViewerPage)} />
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
