import { Link } from "react-router-dom";
import {
  Dumbbell,
  Users,
  CreditCard,
  BarChart3,
  QrCode,
  Wrench,
  Shield,
  ArrowRight,
  CheckCircle2,
  Building2,
  ClipboardList,
} from "lucide-react";

const features = [
  {
    icon: <Building2 className="w-5 h-5" />,
    title: "Multi-Gym Management",
    description:
      "Create and oversee multiple gym locations from a single platform. Assign dedicated admins to each branch.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Member & Trainer Tracking",
    description:
      "Maintain detailed profiles for every member and trainer including contact info, plans, specializations, and unique ID codes.",
  },
  {
    icon: <QrCode className="w-5 h-5" />,
    title: "Attendance Check-In",
    description:
      "Record member attendance via manual code entry. Track who is currently in-gym and view daily check-in history.",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Finance & Payments",
    description:
      "Track revenue, log expenses by category, view payment method breakdowns (UPI, cash, card, online), and monitor pending dues.",
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    title: "Equipment Management",
    description:
      "Maintain an inventory of all gym equipment with status tracking, maintenance schedules, warranty dates, and cost records.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Analytics Dashboard",
    description:
      "View business insights including churn trends, peak-hour patterns, trainer performance comparisons, and plan profitability.",
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    title: "Membership Plans",
    description:
      "Define custom membership plans with flexible pricing, durations, and feature lists. Assign plans to members on enrollment.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Role-Based Access",
    description:
      "Four distinct roles — Super Admin, Gym Admin, Trainer, and Member — each with appropriate access to platform features.",
  },
];

const roles = [
  {
    role: "Super Admin",
    access: "Platform-wide overview, create gyms, assign gym administrators",
  },
  {
    role: "Gym Admin",
    access:
      "Manage members, trainers, attendance, equipment, finance, and analytics for their gym",
  },
  {
    role: "Trainer",
    access: "View assigned members and personal profile",
  },
  {
    role: "Member",
    access:
      "Self-service portal to view plan details, trainer info, and attendance history",
  },
];

const techStack = [
  "React 18",
  "TypeScript",
  "Vite",
  "Tailwind CSS",
  "Supabase (PostgreSQL)",
  "shadcn/ui",
  "Recharts",
  "React Router",
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              AuraGym OS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <Dumbbell className="w-3.5 h-3.5" />
          Open-Source Gym Management Platform
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
          Manage Your Gym
          <br />
          <span className="text-primary">Operations in One Place</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          AuraGym OS is a web-based platform for managing members, trainers,
          attendance, equipment, finances, and analytics — built for single gyms
          and multi-location fitness businesses.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="px-6 py-3 bg-surface-raised text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors shadow-surface"
          >
            See Features
          </a>
        </div>
      </section>

      {/* What It Does */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-card rounded-2xl p-8 shadow-surface-md">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            What This Platform Does
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            AuraGym OS provides a centralized dashboard for fitness business
            operations. It covers the core workflows a gym needs: enrolling and
            tracking members, managing trainers, recording attendance,
            maintaining equipment logs, processing payments and expenses, and
            viewing business analytics. The platform supports multiple gym
            locations under a single super-admin account, and provides
            role-specific views for admins, trainers, and members.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Platform Features
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each feature is a functional module within the application, accessible
            through the sidebar navigation based on user role.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card rounded-xl p-5 shadow-surface hover:shadow-surface-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Role-Based Access
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every user sees only what they need. Routes are protected and
            navigation adapts to the active role.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {roles.map((r) => (
            <div
              key={r.role}
              className="bg-card rounded-xl p-5 shadow-surface flex items-start gap-4"
            >
              <div className="mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {r.role}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {r.access}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Built With</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Modern, open-source technologies for a fast and maintainable
            codebase.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 bg-surface-raised rounded-lg text-sm text-muted-foreground shadow-surface"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-card rounded-2xl p-10 shadow-surface-md text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Sign in to access your gym dashboard, or set up a new gym if you're
            a platform administrator.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              AuraGym OS
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            AuraGym OS — Open-source gym management platform.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
