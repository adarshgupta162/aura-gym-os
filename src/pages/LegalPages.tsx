import { useState } from "react";

type Tab = "terms" | "privacy";

const LegalPages = () => {
  const [tab, setTab] = useState<Tab>("terms");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setTab("terms")} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${tab === "terms" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Terms of Service</button>
          <button onClick={() => setTab("privacy")} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${tab === "privacy" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Privacy Policy</button>
        </div>

        {tab === "terms" && (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">Last updated: April 2026</p>
            <div className="space-y-4 mt-6 text-sm text-foreground/80">
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing and using AuraFarming ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
              <h2 className="text-lg font-semibold text-foreground">2. Service Description</h2>
              <p>AuraFarming provides gym management software-as-a-service including member management, attendance tracking, payment processing, and analytics tools.</p>
              <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration.</p>
              <h2 className="text-lg font-semibold text-foreground">4. Payment Terms</h2>
              <p>Subscription fees are billed monthly/annually. Failure to pay may result in service suspension. All fees are non-refundable unless otherwise stated.</p>
              <h2 className="text-lg font-semibold text-foreground">5. Data Ownership</h2>
              <p>You retain ownership of all data you input into the Platform. We do not sell or share your data with third parties for marketing purposes.</p>
              <h2 className="text-lg font-semibold text-foreground">6. Termination</h2>
              <p>We may suspend or terminate your account for violation of these terms. You may export your data before termination.</p>
              <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
              <p>AuraFarming shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
            </div>
          </div>
        )}

        {tab === "privacy" && (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">Last updated: April 2026</p>
            <div className="space-y-4 mt-6 text-sm text-foreground/80">
              <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p>We collect information you provide directly: name, email, phone number, gym membership details, attendance data, and payment information.</p>
              <h2 className="text-lg font-semibold text-foreground">2. How We Use Information</h2>
              <p>To provide and maintain our services, process transactions, send notifications, and improve user experience.</p>
              <h2 className="text-lg font-semibold text-foreground">3. Data Storage & Security</h2>
              <p>Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your data.</p>
              <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
              <p>We do not sell personal data. Data may be shared with: gym administrators (for their gym's members only), payment processors, and as required by law.</p>
              <h2 className="text-lg font-semibold text-foreground">5. Your Rights</h2>
              <p>You may request access to, correction of, or deletion of your personal data. Contact your gym administrator or our support team.</p>
              <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
              <p>For privacy concerns, contact us at privacy@aurafarming.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalPages;
