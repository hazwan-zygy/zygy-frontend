import { useSearch } from "wouter";
import { useAuth0 } from "@auth0/auth0-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogIn, UserPlus, Sparkles, Atom } from "lucide-react";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const returnTo = params.get("returnTo") ?? "/";

  if (isAuthenticated) {
    window.location.replace(returnTo);
    return null;
  }

  const handleLogin = (signup = false) =>
    loginWithRedirect({
      appState: { returnTo },
      authorizationParams: signup ? { screen_hint: "signup" } : undefined,
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-50 to-slate-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <img src="zygy-logo-dark.png" alt="Logo" width="250" height="80"></img>
              {/* <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Atom className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full animate-pulse"></div> */}
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome to Zygy
          </h1>
          <p className="text-slate-600 text-sm">
            Sign in to your account or create a new one
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl shadow-slate-400/80 bg-white/70 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-slate-800">
              Get Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Login Button */}
            <Button 
              onClick={() => handleLogin(false)}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-medium">
                  Or
                </span>
              </div>
            </div>

            {/* Sign Up Button */}
            <Button 
              variant="outline" 
              onClick={() => handleLogin(true)}
              className="w-full h-11 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            By continuing, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}