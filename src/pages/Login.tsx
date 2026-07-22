import * as React from "react";
import { Link, Navigate } from "react-router-dom";
import { Stethoscope, Mail, Lock, User, ArrowRight, ShieldCheck, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppState } from "@/context/AppStateContext";
import { ROLE_HOME } from "@/data/roles";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { stashPendingClinicSetup, clearPendingClinicSetup } from "@/lib/pendingClinicSetup";

export default function Login() {
  const { loggedIn, role, authLoading, logout } = useAppState();

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [clinic, setClinic] = React.useState("");
  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPassword, setSignupPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);
  // Distinguishes "we just created this account via the signup form" (sign
  // it back out and show a success screen once the clinic/profile setup
  // resolves) from "an ordinary sign-in that should redirect normally."
  // Mirrors the same deliberate choice JoinStaff.tsx makes: creating an
  // account and signing in are two separate, explicit steps, not one
  // implicit one.
  const hasSignedUpRef = React.useRef(false);
  const [signupComplete, setSignupComplete] = React.useState(false);

  React.useEffect(() => {
    if (hasSignedUpRef.current && loggedIn && role && !signupComplete) {
      setSignupComplete(true);
      void logout();
    }
  }, [loggedIn, role, signupComplete, logout]);

  const backToSignIn = () => {
    setMode("signin");
    setEmail(signupEmail);
    hasSignedUpRef.current = false;
    setSignupComplete(false);
  };

  // Auth state is still resolving (session restore + profile fetch) — render
  // nothing rather than the form, so an already-authenticated visitor never
  // sees a flash of the login page before being redirected below.
  if (authLoading) {
    return null;
  }

  // Suppressed for the entire post-signup window — from the moment the
  // profile resolves until logout() actually finishes — not just until
  // signupComplete flips true. Tying this to signupComplete alone leaves a
  // gap: the effect below sets signupComplete and calls logout() in the same
  // tick, but logout() is async, so loggedIn can still read true for a
  // moment after signupComplete is already true. Suppressing on
  // hasSignedUpRef alone (reset only when the user leaves the success
  // screen) covers that whole window.
  if (loggedIn && role && !hasSignedUpRef.current) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }

  // Signed in, but no profile could be resolved — happens if the
  // deferred clinic-setup or staff-invite-acceptance step (run right
  // after email confirmation) failed, e.g. an expired invite. Surface
  // it instead of silently showing the sign-in form again.
  if (loggedIn && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">We couldn't finish setting up your account</CardTitle>
            <CardDescription>
              Your sign-in worked, but the clinic/staff setup step that runs right after didn't complete — possibly an
              expired invite link. Try again, or contact your clinic admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fresh signup's clinic/profile setup just resolved — sign-out is in
  // flight (see the effect above). Success screen takes over once it lands.
  if (hasSignedUpRef.current && !signupComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">Finishing setup...</p>
      </div>
    );
  }

  if (signupComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl">Clinic Created</CardTitle>
            <CardDescription>Sign in with your new email and password to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={backToSignIn}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) setError(signInError.message);
    // On success, AppStateContext's auth listener resolves the role and
    // this component re-renders into the redirect branch above.
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResending(true);
    setError(null);
    setInfo(null);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setInfo("Confirmation email resent — check your inbox (and spam folder) for a new link.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    stashPendingClinicSetup({ clinicName: clinic, adminName: name });
    hasSignedUpRef.current = true;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    });
    setLoading(false);

    if (signUpError) {
      clearPendingClinicSetup();
      hasSignedUpRef.current = false;
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      hasSignedUpRef.current = false;
      setInfo("Account created — check your email to confirm it, then sign in to finish setting up your clinic.");
      return;
    }
    // A session exists immediately (email confirmation disabled on this
    // project) — AppStateContext will pick up the pending clinic setup,
    // create the clinic + admin profile, and the effect above signs it back
    // out and shows the success screen instead of redirecting into the
    // dashboard directly.
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">DentVerse</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            "Since switching to DentVerse, my no-shows dropped by 50% and I get my evenings back."
          </h2>
          <p className="mt-6 text-primary-foreground/80">Dr. Ananya Rao</p>
          <p className="text-sm text-primary-foreground/60">DentVerse Smile Studio</p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-primary-foreground/70">
          <ShieldCheck className="h-4 w-4" />
          Secure staff access · Supabase Auth
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-muted/30 p-6 lg:w-1/2">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <Stethoscope className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl">{mode === "signin" ? "Staff Login" : "Create Your Clinic"}</CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Sign in to access your clinic dashboard"
                : "You'll be set up as the clinic admin — invite your team from Staff Management once you're in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSupabaseConfigured && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Supabase isn't configured yet — sign-in/sign-up will fail until <code>.env</code> is set up. See{" "}
                  <code>DentVerseDocs/13-setup-guides/backend-setup.md</code>.
                </span>
              </div>
            )}

            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as "signin" | "signup");
                setError(null);
                setInfo(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@clinic.com"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" className="text-xs font-medium text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  {mode === "signin" && error && (
                    <div className="space-y-1.5">
                      <p className="text-sm text-destructive">{error}</p>
                      {error.toLowerCase().includes("confirm") && (
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                          onClick={handleResendConfirmation}
                          disabled={resending || !email}
                        >
                          {resending ? "Resending..." : "Resend confirmation email"}
                        </button>
                      )}
                    </div>
                  )}
                  {mode === "signin" && info && <p className="text-sm text-success">{info}</p>}
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  New to DentVerse?{" "}
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("signup")}>
                    Create an account
                  </button>
                </p>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Jane Doe"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="clinic">Clinic Name</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="clinic"
                        value={clinic}
                        onChange={(e) => setClinic(e.target.value)}
                        placeholder="Bright Smile Dental Clinic"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@clinic.com"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="pl-9"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  {mode === "signup" && error && <p className="text-sm text-destructive">{error}</p>}
                  {mode === "signup" && info && <p className="text-sm text-success">{info}</p>}
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Creating account..." : "Create Clinic Account"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>
                    Sign in
                  </button>
                </p>
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Staff accounts are real (Supabase Auth) — clinic data is being connected milestone by milestone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
