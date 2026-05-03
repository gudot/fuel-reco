import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page-redesign" data-testid="login-page">
      {/* Background decorations */}
      <div className="auth-blob auth-blob-1" aria-hidden="true" />
      <div className="auth-blob auth-blob-2" aria-hidden="true" />
      <div className="auth-blob auth-blob-3" aria-hidden="true" />

      <div className="auth-layout">
        {/* Hero / Brand section */}
        <div className="auth-hero">
          <div className="auth-brand">
            <div className="auth-logo">
              <Image
                src="/fpIcon.png"
                alt="First Pack Fuel Reconciliation logo"
                width={72}
                height={72}
                priority
                data-testid="company-logo"
              />
            </div>
            <h1 className="auth-hero-title">Fuel Reconciliation</h1>
            <p className="auth-hero-subtitle">First Pack Marketing</p>
          </div>

          <div className="auth-features">
            <FeatureItem icon="📊" text="Real-time fuel stock tracking" />
            <FeatureItem icon="🚗" text="Vehicle allocation & balance monitoring" />
            <FeatureItem icon="📐" text="Mileage reconciliation with KPI analysis" />
            <FeatureItem icon="⚠️" text="Automated anomaly detection & alerts" />
            <FeatureItem icon="📈" text="Excel export with audit trails" />
          </div>
        </div>

        {/* Login card */}
        <div className="auth-card-redesign" data-testid="login-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to manage fuel inventory, allocations and view reconciliation reports.</p>
          </div>
          <LoginForm />
          <div className="auth-card-footer">
            <p>Need any help? Contact wekwaGudo or Ropah your system admins.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="auth-feature-item">
      <span className="auth-feature-icon" aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

