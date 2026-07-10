import { Link } from "react-router-dom";
import {
  Stethoscope,
  MessageCircle,
  Mic,
  CalendarClock,
  FileText,
  ClipboardList,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Star,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: MessageCircle,
    title: "WhatsApp-Native Patients",
    description: "Patients book, reschedule, and get reminders entirely over WhatsApp — no app to download, no login to remember.",
  },
  {
    icon: Bot,
    title: "AI Digital Receptionist",
    description: "Your AI front desk handles booking requests, triages urgency, and keeps your calendar full — 24/7, without lifting a finger.",
  },
  {
    icon: Mic,
    title: "Voice-to-Chart",
    description: "Dictate clinical notes during or after a visit — AI structures it into a clean SOAP chart note automatically.",
  },
  {
    icon: FileText,
    title: "Smart Prescriptions",
    description: "Generate and send prescriptions straight to a patient's WhatsApp in seconds, with AI-suggested dosages.",
  },
  {
    icon: ClipboardList,
    title: "Treatment Planning",
    description: "Build multi-phase treatment plans with transparent cost breakdowns patients can review and approve.",
  },
  {
    icon: CalendarClock,
    title: "Unified Calendar",
    description: "See requests, confirmations, and cancellations in one clean, always up-to-date schedule view.",
  },
];

const steps = [
  { title: "Patient messages on WhatsApp", description: "\"Hi, I have tooth pain\" — that's all it takes to start." },
  { title: "AI receptionist responds instantly", description: "Understands intent, checks your calendar, books or triages." },
  { title: "You focus on clinical care", description: "Walk in, see a full patient workspace, chart with your voice." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">DentVerse</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#testimonial" className="hover:text-foreground">Testimonials</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <a href="#features">Learn More</a>
            </Button>
            <Button asChild>
              <Link to="/login">
                Staff Login <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Dental Practice Platform
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Your clinic's front desk,
              <br />
              <span className="text-primary">reimagined with AI.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Patients chat on WhatsApp. Your AI receptionist books, reminds, and triages.
              You walk in and focus entirely on care — DentVerse handles the rest.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/login">
                  Staff Login <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href="#features">Learn More</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Patients never need to log in — everything happens on WhatsApp.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-border bg-card p-3 shadow-xl">
            <div className="flex items-center gap-1.5 border-b border-border px-3 pb-3">
              <span className="h-3 w-3 rounded-full bg-destructive/40" />
              <span className="h-3 w-3 rounded-full bg-warning/40" />
              <span className="h-3 w-3 rounded-full bg-success/40" />
              <span className="ml-3 text-xs text-muted-foreground">DentVerse Doctor Dashboard</span>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              {[
                { label: "Today's Appointments", value: "8", sub: "3 confirmed, 5 upcoming" },
                { label: "Pending Requests", value: "4", sub: "AI awaiting your review" },
                { label: "Weekly Revenue", value: "₹1,86,500", sub: "+18% vs last week" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-muted/40 p-4 text-left">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-success">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              A completely reimagined workflow — patients never touch a dashboard.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything your practice needs</h2>
            <p className="mt-3 text-muted-foreground">
              One platform connecting patient conversations to clinical workflows.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonial" className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center gap-1 text-warning">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <blockquote className="mt-6 text-xl font-medium text-foreground">
            "DentVerse's AI receptionist cut our no-show rate in half and I finally get to spend
            my evenings with family instead of calling patients back."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">Dr. Ananya Rao — DentVerse Smile Studio</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Ready to modernize your practice?</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Log in to the doctor dashboard and see how DentVerse brings AI to your front desk.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to="/login">
              Staff Login <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>DentVerse</span>
          </div>
          <p>This is a clickable prototype for presentation purposes. No real data is processed.</p>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            HIPAA-minded design
          </div>
        </div>
      </footer>
    </div>
  );
}
