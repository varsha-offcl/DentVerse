import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Stethoscope, Lock, User, ArrowRight, Mail, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/context/AppStateContext";
import { ROLE_HOME, ROLE_LABELS } from "@/data/roles";
import type { Role } from "@/data/roles";
import { supabase } from "@/lib/supabase";
import { stashPendingStaffInvite, clearPendingStaffInvite } from "@/lib/pendingStaffInvite";

interface InviteDetails {
  clinicName: string;
  role: Role;
  email: string;
  name: string;
  valid: boolean;
}

export default function JoinStaff() {
  const { loggedIn, role, authLoading, logout } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("invite");

  const [checking, setChecking] = React.useState(true);
  const [invite, setInvite] = React.useState<InviteDetails | null>(null);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  // Distinguishes "a stale session was already here when the page loaded"
  // (auto sign it out below) from "this is the account we just created by
  // submitting the form" (never sign that one out).
  const hasJoinedRef = React.useRef(false);
  // Guards the auto-sign-out so it only ever evaluates the session state
  // present at page load, exactly once — never a later change. Supabase
  // syncs auth state across every same-origin tab (localStorage +
  // BroadcastChannel), so without this guard, signing in successfully in
  // a *different* tab while a stale /join tab sits open in the background
  // would sync `loggedIn: true` into this tab, trigger a "sign it out"
  // reaction here, and that sign-out would then sync back out to every
  // other tab too — silently nuking a session you just successfully
  // created elsewhere. Evaluating only the initial snapshot avoids this
  // entirely: a real stale session is caught once at load, a cross-tab
  // sync arriving later is simply ignored.
  const initialAuthCheckedRef = React.useRef(false);
  const [signingOutStale, setSigningOutStale] = React.useState(false);

  // A pre-existing session blocks accept_staff_invite (it requires a
  // profile-less auth.uid()) and previously left the visitor stuck reading
  // an explanation with a manual "Sign Out" button. This page has exactly
  // one purpose — accept this specific invite — so a stale session here is
  // never worth preserving; sign it out automatically instead.
  React.useEffect(() => {
    if (authLoading || initialAuthCheckedRef.current) return;
    initialAuthCheckedRef.current = true;
    if (loggedIn) {
      setSigningOutStale(true);
      void logout();
    }
  }, [authLoading, loggedIn, logout]);

  // Once the newly-created account's profile resolves — immediately if
  // email confirmation is off, since accept_staff_invite then runs right
  // away — send them to their real dashboard instead of leaving them
  // stranded on this page.
  React.useEffect(() => {
    if (hasJoinedRef.current && loggedIn && role) {
      navigate(ROLE_HOME[role], { replace: true });
    }
  }, [loggedIn, role, navigate]);

  React.useEffect(() => {
    if (!token) {
      setTokenError("This invite link is missing its token — ask your admin to resend it.");
      setChecking(false);
      return;
    }
    let active = true;
    supabase
      .rpc("get_staff_invite", { p_token: token })
      .then(({ data, error: rpcError }) => {
        if (!active) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (rpcError || !row) {
          setTokenError("This invite link isn't valid.");
        } else if (!row.valid) {
          setTokenError("This invite has already been used, was revoked, or has expired — ask your admin for a new link.");
        } else {
          setInvite(row);
          setName(row.name ?? "");
        }
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || !token) return;
    setError(null);
    setInfo(null);
    setLoading(true);

    stashPendingStaffInvite({ token, name: name.trim() });
    hasJoinedRef.current = true;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
    });
    setLoading(false);

    if (signUpError) {
      clearPendingStaffInvite();
      hasJoinedRef.current = false;
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setInfo("Account created — check your email to confirm it, then sign in to finish joining the team.");
      return;
    }
    // A session exists immediately (email confirmation disabled) —
    // AppStateContext picks up the pending invite, accepts it, and the
    // redirect effect above sends them to their dashboard once the
    // profile resolves.
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Join Your Clinic</CardTitle>
          {invite && (
            <CardDescription>
              You've been invited to join <span className="font-medium text-foreground">{invite.clinicName}</span> as a{" "}
              <span className="font-medium text-foreground">{ROLE_LABELS[invite.role]}</span>.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {(checking || authLoading) && (
            <p className="text-center text-sm text-muted-foreground">Checking your invite...</p>
          )}

          {!checking && !authLoading && tokenError && (
            <div className="space-y-4 text-center">
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{tokenError}</span>
              </div>
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                Go to Sign In
              </Link>
            </div>
          )}

          {signingOutStale && loggedIn && !hasJoinedRef.current && (
            <p className="text-center text-sm text-muted-foreground">Switching accounts to accept this invite...</p>
          )}

          {hasJoinedRef.current && loggedIn && !role && (
            <p className="text-center text-sm text-muted-foreground">Finishing setup...</p>
          )}

          {!checking && !authLoading && invite && !loggedIn && !info && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="join-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="join-email" value={invite.email} disabled className="pl-9" />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="join-name">Full Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="join-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jane Doe"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="join-password">Create a Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="join-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating account..." : "Join the Team"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> This link only works for {invite.email}.
              </p>
            </form>
          )}

          {info && (
            <div className="space-y-4 text-center">
              <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-left text-sm text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{info}</span>
              </div>
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                Go to Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
