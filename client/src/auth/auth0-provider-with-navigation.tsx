import { Auth0Provider } from "@auth0/auth0-react";
import { ReactNode } from "react";
import { useLocation } from "wouter";

interface Props {
  children: ReactNode;
}

export function Auth0ProviderWithNavigate({ children }: Props) {
  const [, navigate] = useLocation();

  const domain   = import.meta.env.VITE_AUTH0_DOMAIN as string;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;

  if (!domain || !clientId) {
    return <>Missing Auth0 configuration</>;
  }

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    navigate(appState?.returnTo ?? "/");
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}