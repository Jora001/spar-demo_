import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/rs/app-shell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in — RoboShield" },
      { name: "description", content: "Sign in to the RoboShield robot cybersecurity console." },
      { property: "og:title", content: "Sign in — RoboShield" },
      { property: "og:description", content: "Sign in to the RoboShield console." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const go = (e?: React.FormEvent) => {
    e?.preventDefault();
    login();
    navigate({ to: "/" });
  };
  return (
    <div className="bg-glow grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r p-10 lg:flex">
        <Logo />
        <div>
          <h1 className="text-4xl font-semibold leading-tight">Cybersecurity for robots that never compromises physical safety.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">EDR, IDS/IPS, integrity monitoring and human-approved response for every robot in your fleet.</p>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Safety-first robot protection · Demo</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <p className="mb-6 text-sm text-muted-foreground">Demo: any credentials work.</p>
            <form onSubmit={go} className="space-y-4">
              <div className="space-y-1.5"><Label>Email</Label><Input defaultValue="elmira@roboshield.io" /></div>
              <div className="space-y-1.5"><Label>Password</Label><Input type="password" defaultValue="demo-password" /></div>
              <Button type="submit" className="w-full">Sign in</Button>
            </form>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
            <Button variant="outline" className="w-full" onClick={() => go()}><KeyRound />Continue with SSO (OIDC)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
