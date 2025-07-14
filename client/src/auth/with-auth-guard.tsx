import { ComponentType } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "wouter";

export function withAuthGuard<T extends object>(Component: ComponentType<T>) {
  return function Guarded(props: T) {
    const { isAuthenticated, isLoading } = useAuth0();
    const [, navigate] = useLocation();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          Loading…
        </div>
      );
    }

    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(window.location.pathname);
      navigate(`/login?returnTo=${returnTo}`, { replace: true });
      return null;
    }

    return <Component {...props} />;
  };
}