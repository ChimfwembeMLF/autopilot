import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Loader2, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      toast({
        title: "Reset Link Sent",
        description: res?.message || "Password recovery instructions have been sent to your email.",
      });
      setForgotEmail("");
      setShowForgot(false);
    } catch (err: any) {
      toast({
        title: "Request Failed",
        description: err.message || "Failed to initiate password reset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary safe-top justify-center items-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* App Logo */}
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center shadow-md">
            <Package className="h-7 w-7 text-accent-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground mb-1">AG Shipment</h1>
        <p className="text-primary-foreground/60 text-sm mb-8">Track your deliveries in real-time</p>

        {showForgot ? (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleForgotSubmit} className="w-full space-y-4 animate-slide-up bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white">Reset Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail("");
                    setShowForgot(false);
                  }}
                  className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </button>
              </div>
              <p className="text-xs text-white/70 leading-relaxed pb-2">
                Enter your registered email address below and we'll send you instructions to recover your password.
              </p>
              <div className="relative">
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/25 pr-10"
                />
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              </div>
            </div>
            <Button
              type="submit"
              disabled={forgotLoading}
              className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base shadow-sm"
            >
              {forgotLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send Recovery Link"
              )}
            </Button>
          </form>
        ) : (
          /* STANDARD SIGN IN FORM */
          <form onSubmit={handleLoginSubmit} className="w-full space-y-4 animate-slide-up bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/25"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs font-semibold text-white/70 hover:text-white hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/25 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base shadow-sm"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
