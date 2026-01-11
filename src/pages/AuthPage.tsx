import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { login, register } from "@/store/authSlice";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import logo from "@/assets/images/logo.svg";
import logodark from "@/assets/images/logodark.svg";
import { showError, showSuccess } from "@/services/notificationService";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");

  // Sync state with URL
  useEffect(() => {
    setIsLogin(location.pathname === "/login");
  }, [location.pathname]);

  const handleToggle = () => {
    const target = isLogin ? "/signup" : "/login";
    navigate(target);
  };

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation Error States
  const [loginEmailError, setLoginEmailError] = useState("");
  const [signupEmailError, setSignupEmailError] = useState("");
  const [signupPasswordError, setSignupPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const API_BASE =
    (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";

  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((s: RootState) => s.auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginEmailError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      setLoginEmailError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      await dispatch(
        login({ email: loginEmail, password: loginPassword })
      ).unwrap();
      showSuccess("Login successful! Welcome back.");
      navigate("/home");
    } catch (err: any) {
      console.error("Login error", err);
      // err is the rejected value (detail from backend)
      showError(err || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSignupEmailError("");
    setSignupPasswordError("");
    setConfirmPasswordError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setSignupEmailError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (signupPassword.length < 8) {
      setSignupPasswordError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
    if (signupPassword.length > 72) {
      setSignupPasswordError("Password must be 72 characters or less.");
      setLoading(false);
      return;
    }
    if (signupPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await dispatch(
        register({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        })
      ).unwrap();
      showSuccess("Account created successfully! Welcome aboard.");
      navigate("/home");
    } catch (err: any) {
      console.error("Signup error", err);
      // err is the rejected value (detail from backend)
      showError(err || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Generate chaotic plexus pattern
  const plexusPattern = useMemo(() => {
    const nodes: { x: number; y: number; r: number }[] = [];
    const width = 1000;
    const height = 1000;
    const nodeCount = 80; // Reduced density

    // Generate random nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 2, // Larger varying sizes
      });
    }

    // Generate connections based on distance
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
    }[] = [];
    nodes.forEach((node, i) => {
      // Connect to nearest neighbors
      nodes.slice(i + 1).forEach((otherNode) => {
        const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
        if (dist < 200) {
          // Increased connection threshold
          lines.push({
            x1: node.x,
            y1: node.y,
            x2: otherNode.x,
            y2: otherNode.y,
            opacity: (1 - dist / 200) * 0.5, // Lower opacity
          });
        }
      });
    });

    return { nodes, lines };
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 overflow-hidden relative">
      {/* Chaotic Plexus / Constellation Pattern */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="neuron-net-body"
              x="0"
              y="0"
              width="1000"
              height="1000"
              patternUnits="userSpaceOnUse"
            >
              {/* Generated Lines */}
              {plexusPattern.lines.map((line, i) => (
                <line
                  key={`line-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-300 dark:text-blue-600"
                  style={{ opacity: line.opacity }}
                />
              ))}

              {/* Generated Nodes */}
              {plexusPattern.nodes.map((node, i) => (
                <circle
                  key={`node-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  className="fill-slate-300 dark:fill-blue-500"
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neuron-net-body)" />
        </svg>
      </div>

      {/* Gradient Blobs for Glassmorphism Contrast */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 dark:hidden rounded-full blur-3xl animate-pulse z-0 pointer-events-none" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/30 dark:hidden rounded-full blur-3xl animate-pulse z-0 pointer-events-none"
        style={{ animationDelay: "1s" }}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-[1200px] min-h-[700px] bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-900/60 dark:to-slate-900/30 backdrop-blur-3xl border border-white/50 dark:border-slate-600/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:block z-10">
        {/* Theme Toggle - Fixed Position */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        {/* Login Form Container - Left Side */}
        <div
          className={cn(
            "lg:absolute lg:top-0 lg:left-0 lg:h-full lg:w-1/2 p-10 flex flex-col justify-center transition-all duration-700 ease-in-out",
            // Mobile visibility logic
            !isLogin && "hidden lg:flex",
            "z-10"
          )}
        >
          <div className="max-w-md mx-auto w-full space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:text-white">
                Sign In
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Welcome back to Fin Finder
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="m@example.com"
                      value={loginEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLoginEmail(val);
                        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                          setLoginEmailError(
                            "Please enter a valid email address."
                          );
                        } else {
                          setLoginEmailError("");
                        }
                      }}
                      className="pl-10 h-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-slate-600 focus:bg-white/50 dark:focus:bg-slate-800/50 transition-all shadow-inner placeholder:text-slate-400"
                      required
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3.5 top-3.5 h-5 w-5 text-violet-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  {loginEmailError && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {loginEmailError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      maxLength={72}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-slate-600 focus:bg-white/50 dark:focus:bg-slate-800/50 transition-all shadow-inner placeholder:text-slate-400"
                      required
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3.5 top-3.5 h-5 w-5 text-violet-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-violet-500 transition-colors"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    className="rounded-sm border-violet-400/50 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-slate-600 dark:text-slate-400"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  to="#"
                  className="text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-lg font-medium shadow-lg shadow-violet-200 dark:shadow-none transition-all"
              >
                Sign In
              </Button>
            </form>

            <div className="text-center lg:hidden">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{" "}
                <button
                  onClick={handleToggle}
                  className="text-violet-600 font-medium hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Signup Form Container - Right Side */}
        <div
          className={cn(
            "lg:absolute lg:top-0 lg:right-0 lg:h-full lg:w-1/2 p-10 flex flex-col justify-center transition-all duration-700 ease-in-out",
            // Mobile visibility logic
            isLogin && "hidden lg:flex",
            "z-10"
          )}
        >
          <div className="max-w-md mx-auto w-full space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:text-white">
                Create Account
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Join our community today
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-slate-600 focus:bg-white/50 dark:focus:bg-slate-800/50 transition-all shadow-inner placeholder:text-slate-400"
                      required
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3.5 top-3.5 h-5 w-5 text-violet-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="m@example.com"
                      value={signupEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignupEmail(val);
                        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                          setSignupEmailError(
                            "Please enter a valid email address."
                          );
                        } else {
                          setSignupEmailError("");
                        }
                      }}
                      className="pl-10 h-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-slate-600 focus:bg-white/50 dark:focus:bg-slate-800/50 transition-all shadow-inner placeholder:text-slate-400"
                      required
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3.5 top-3.5 h-5 w-5 text-violet-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  {signupEmailError && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {signupEmailError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      maxLength={72}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignupPassword(val);
                        if (val && val.length < 8) {
                          setSignupPasswordError(
                            "Password must be at least 8 characters long."
                          );
                        } else if (val && val.length > 72) {
                          setSignupPasswordError(
                            "Password must be 72 characters or less."
                          );
                        } else {
                          setSignupPasswordError("");
                        }
                        if (confirmPassword && val !== confirmPassword) {
                          setConfirmPasswordError("Passwords do not match.");
                        } else if (confirmPassword) {
                          setConfirmPasswordError("");
                        }
                      }}
                      className="pl-10 pr-10 h-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-slate-600 focus:bg-white/50 dark:focus:bg-slate-800/50 transition-all shadow-inner placeholder:text-slate-400"
                      required
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3.5 top-3.5 h-5 w-5 text-violet-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-violet-500 transition-colors"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {signupPasswordError && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {signupPasswordError}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    maxLength={72}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfirmPassword(val);
                      if (val && val !== signupPassword) {
                        setConfirmPasswordError("Passwords do not match.");
                      } else {
                        setConfirmPasswordError("");
                      }
                    }}
                    className="pl-10 pr-10 h-12 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-slate-600 focus:bg-white/50 dark:focus:bg-slate-800/50 transition-all shadow-inner placeholder:text-slate-400"
                    required
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3.5 top-3.5 h-5 w-5 text-violet-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <path d="M12 14v2" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-violet-500 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-red-500 text-xs mt-1 ml-1">
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-lg font-medium shadow-lg shadow-violet-200 dark:shadow-none transition-all"
              >
                Sign Up
              </Button>

              <div className="text-center lg:hidden">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{" "}
                  <button
                    onClick={handleToggle}
                    className="text-violet-600 font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Sliding Overlay - Desktop Only */}
        <div
          className={cn(
            "hidden lg:flex absolute top-0 left-0 h-full w-1/2 bg-gradient-to-br from-violet-600 to-indigo-900 items-center justify-center text-white z-20 transition-all duration-700 ease-in-out overflow-hidden",
            // Transform logic:
            // isLogin (Login View) -> Image should be on RIGHT.
            // !isLogin (Signup View) -> Image should be on LEFT.
            isLogin
              ? "translate-x-full rounded-l-[150px]"
              : "translate-x-0 rounded-r-[150px]"
          )}
        >
          {/* Abstract Background Elements - Restored */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 left-10 text-white/20 text-6xl font-light">
              +
            </div>
            <div className="absolute bottom-20 right-20 h-32 w-32 border-4 border-white/10 rounded-full"></div>
            <div className="absolute top-1/3 right-10 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
            <svg
              className="absolute bottom-0 left-0 w-full h-1/2 text-white/10"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                fill="currentColor"
                d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>

          {/* Content Container */}
          <div className="relative z-10 h-full w-full flex items-center justify-center">
            {/* Login Mode Content (Shown when Image is Right) */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center p-12 text-center transition-all duration-700 delay-100",
                isLogin
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-20 pointer-events-none"
              )}
            >
              <div className="relative flex items-center justify-center mb-6 mx-auto bg-slate-50 dark:bg-slate-950 p-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border-4 border-white/10 ring-1 ring-white/20 w-[304px] h-[304px] shrink-0">
                {/* Neuron Pattern Background */}
                <div className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none">
                  <svg
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#neuron-net-body)"
                    />
                  </svg>
                </div>
                {/* Glass Shine/Reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 pointer-events-none rounded-full" />
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] rounded-full pointer-events-none" />

                <img
                  src={logo}
                  alt="Logo"
                  className="relative h-64 w-64 z-10 drop-shadow-2xl dark:hidden"
                />
                <img
                  src={logodark}
                  alt="Logo"
                  className="relative h-64 w-64 z-10 drop-shadow-2xl hidden dark:block"
                />
              </div>
              <div className="max-w-lg mx-auto">
                <h1 className="text-4xl font-bold mb-4">New Here?</h1>
                <p className="text-lg text-white/80 mb-8 leading-relaxed">
                  Sign up and discover a great amount of new opportunities!
                </p>
                <Button
                  onClick={handleToggle}
                  variant="outline"
                  className="h-12 px-8 rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-indigo-900 text-lg font-medium transition-all"
                >
                  Sign Up
                </Button>
              </div>
            </div>

            {/* Signup Mode Content (Shown when Image is Left) */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center p-12 text-center transition-all duration-700 delay-100",
                !isLogin
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-20 pointer-events-none"
              )}
            >
              <div className="relative flex items-center justify-center mb-6 mx-auto bg-slate-50 dark:bg-slate-950 p-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border-4 border-white/10 ring-1 ring-white/20 w-[304px] h-[304px] shrink-0">
                {/* Neuron Pattern Background */}
                <div className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none">
                  <svg
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#neuron-net-body)"
                    />
                  </svg>
                </div>
                {/* Glass Shine/Reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 pointer-events-none rounded-full" />
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] rounded-full pointer-events-none" />

                <img
                  src={logo}
                  alt="Logo"
                  className="relative h-64 w-64 z-10 drop-shadow-2xl dark:hidden"
                />
                <img
                  src={logodark}
                  alt="Logo"
                  className="relative h-64 w-64 z-10 drop-shadow-2xl hidden dark:block"
                />
              </div>
              <div className="max-w-lg mx-auto">
                <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
                <p className="text-lg text-white/80 mb-8 leading-relaxed">
                  To keep connected with us please login with your personal
                  info.
                </p>
                <Button
                  onClick={handleToggle}
                  variant="outline"
                  className="h-12 px-8 rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-indigo-900 text-lg font-medium transition-all"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
