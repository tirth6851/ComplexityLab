import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy · ComplexityLab",
  description: "How ComplexityLab collects, uses, and protects your data.",
};

const CONTACT_EMAIL = "tirth2093@gmail.com";
const TEAM_CONTACT_EMAIL = "tkpatel10902@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="June 9, 2026">
      <LegalSection heading="Who we are">
        <p>
          ComplexityLab (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an interactive
          web application for learning algorithms and computational
          complexity. For any privacy-related questions, requests, or
          concerns, you can contact the ComplexityLab team at:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </li>
          <li>
            <a className="text-primary hover:underline" href={`mailto:${TEAM_CONTACT_EMAIL}`}>
              {TEAM_CONTACT_EMAIL}
            </a>
          </li>
        </ul>
        <p>
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>
          <strong className="text-ink-primary">Account data.</strong> Sign-in
          is handled by Clerk using Google. We receive your name, email
          address, and profile picture from your Google account. We never see
          or store a password.
        </p>
        <p>
          <strong className="text-ink-primary">Content you create.</strong>{" "}
          Code you submit to the analyzer is processed to produce a complexity
          result. It is stored only when you explicitly save an analysis or a
          snippet; otherwise it is discarded after the analysis completes.
          Saved analyses and snippets are private to your account.
        </p>
        <p>
          <strong className="text-ink-primary">Profile settings.</strong> An
          optional display name and a preferred programming language.
        </p>
        <p>
          <strong className="text-ink-primary">Technical data.</strong> Server
          logs for security and reliability (timestamps, account identifier,
          selected language, code size, result class, durations, and
          rate-limit events). We do not log the content of your code.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          To operate the product (run analyses, store what you save, show your
          dashboard), to keep the service secure (authentication, rate
          limiting, abuse prevention), and to fix problems (error logs). We do
          not sell your data and we do not use it for advertising.
        </p>
        <p>
          When AI-assisted analysis is enabled, the code you submit is sent to
          our AI inference provider (Groq, Inc.) solely to produce your
          analysis result.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>We use a small set of strictly functional cookies:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-mono text-xs">__session</span> and related
            Clerk cookies — keep you signed in (essential).
          </li>
          <li>
            <span className="font-mono text-xs">cl-consent</span> — remembers
            that you accepted this policy (essential).
          </li>
          <li>
            <span className="font-mono text-xs">theme</span> (localStorage) —
            remembers your light/dark preference.
          </li>
        </ul>
        <p>
          We do not use advertising or cross-site tracking cookies. Because
          the essential cookies are required for the service to function, you
          must accept them to use ComplexityLab.
        </p>
      </LegalSection>

      <LegalSection heading="Who processes your data">
        <p>
          We rely on these service providers, each receiving only what they
          need to perform their function:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Clerk (authentication and session management)</li>
          <li>Google (sign-in identity provider)</li>
          <li>Supabase (database hosting for your saved content)</li>
          <li>Vercel (application hosting and logs)</li>
          <li>Groq (AI inference, only when AI analysis is enabled)</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Retention and deletion">
        <p>
          Saved analyses and snippets are kept until you delete them. You can
          delete individual items from their pages, or remove{" "}
          <em>everything</em> at once from Settings → Account → Danger zone
          (&ldquo;Delete all lab data&rdquo;). Deleting your data there is
          immediate and irreversible. To remove your sign-in identity as well,
          contact us at {CONTACT_EMAIL} or remove the app&rsquo;s access from
          your Google account.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Depending on where you live (e.g. GDPR in the EU/UK, CCPA in
          California), you may have rights to access, correct, export, or
          delete your personal data, and to object to or restrict certain
          processing. Exercise them via the in-app deletion tools or by
          emailing {CONTACT_EMAIL}. We respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          All traffic is encrypted in transit (HTTPS). Database access is
          restricted to server-side code with row-level security enabled, and
          privileged keys are never shipped to the browser. API endpoints are
          authenticated and rate-limited.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          ComplexityLab is not directed at children under 13 (or the minimum
          age in your jurisdiction), and we do not knowingly collect their
          data. If you believe a child has used the service, contact us and we
          will delete the data.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If we materially change this policy, we will update the effective
          date above and ask for your consent again on your next visit.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
