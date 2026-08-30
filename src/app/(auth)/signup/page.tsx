"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEFAULT_TARGETS } from "@/lib/types";
import { MICROCOPY } from "@/lib/constants";
import { UserPlus, MailCheck } from "lucide-react";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Email confirmation is on by default in most Supabase projects, so
    // there may be no active session yet — in that case, ask them to
    // confirm before we seed anything.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    // Seed default targets so Settings / Weekly Balance Score have
    // sensible values from day one.
    if (data.user) {
      await supabase.from("user_targets").upsert(
        { ...DEFAULT_TARGETS, user_id: data.user.id },
        { onConflict: "user_id" }
      );
    }

    router.replace("/overview");
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (checkEmail) {
    return (
      <div className="gradient-aurora flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="flex flex-col items-center gap-3 pt-8">
            <MailCheck className="h-10 w-10 text-primary" />
            <h2 className="font-display text-xl font-semibold">Check your inbox</h2>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-medium">{email}</span>. Confirm it, then come
              back and sign in.
            </p>
            <Link href="/login" className="mt-2">
              <Button variant="soft">Back to sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="gradient-aurora flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">Daily Ilzam</h1>
          <p className="mt-2 text-sm text-muted-foreground">{MICROCOPY.tagline}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Start your comeback</CardTitle>
            <CardDescription>{MICROCOPY.consistencyWin}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              {error && <p className="text-sm text-critical">{error}</p>}
              <Button type="submit" size="lg" className="mt-2 gap-2" disabled={loading}>
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogle}>
              Continue with Google
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
