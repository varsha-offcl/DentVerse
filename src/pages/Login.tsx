import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Building2,
  Headphones,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppState } from "@/context/AppStateContext";
import { currentDoctor } from "@/data/mockData";
import { currentReceptionist, currentAdmin, ROLE_HOME, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/data/roles";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: { role: Role; icon: React.ElementType }[] = [
  { role: "doctor", icon: Stethoscope },
  { role: "receptionist", icon: Headphones },
  { role: "admin", icon: Settings2 },
];

const ROLE_DEFAULT_EMAIL: Record<Role, string> = {
  doctor: currentDoctor.email,
  receptionist: currentReceptionist.email,
  admin: currentAdmin.email,
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppState();

  const [role, setRole] = React.useState<Role>("doctor");
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState(ROLE_DEFAULT_EMAIL.doctor);
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [clinic, setClinic] = React.useState("");
  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPassword, setSignupPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setEmail(ROLE_DEFAULT_EMAIL[nextRole]);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(role);
      navigate(ROLE_HOME[role]);
    }, 500);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(role);
      navigate(ROLE_HOME[role]);
    }, 500);
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
          Secure staff access · Demo environment
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-muted/30 p-6 lg:w-1/2">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <Stethoscope className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl">{mode === "signin" ? "Staff Login" : "Create Your Account"}</CardTitle>
            <CardDescription>
              {mode === "signin" ? "Sign in to access your clinic dashboard" : "Set up your clinic on DentVerse in under a minute"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleRoleChange(opt.role)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors",
                    role === opt.role
                      ? "border-primary bg-secondary text-primary"
                      : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{ROLE_LABELS[opt.role]}</span>
                </button>
              ))}
            </div>
            <p className="mb-5 text-center text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
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
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Signing in..." : `Sign In as ${ROLE_LABELS[role]}`}
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
                        placeholder="Create a password"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Creating account..." : `Create ${ROLE_LABELS[role]} Account`}
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
              This is a prototype — any details will work, no data is stored.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
