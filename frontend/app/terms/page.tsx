import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service · ComplexityLab",
  description: "The terms that govern your use of ComplexityLab.",
};

const CONTACT_EMAIL = "tirth2093@gmail.com";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="June 9, 2026">
      <LegalSection heading="1. Acceptance">
        <p>
          By accessing or using ComplexityLab (the &ldquo;Service&rdquo;) you
          agree to these Terms and to our Privacy Policy. If you do not agree,
          do not use the Service. Use of the Service requires accepting these
          terms via the consent prompt.
        </p>
      </LegalSection>

      <LegalSection heading="2. The Service">
        <p>
          ComplexityLab provides educational tooling for analyzing the
          computational complexity of code. Analysis results — whether
          produced by heuristics or by AI models — are{" "}
          <strong className="text-ink-primary">
            estimates for learning purposes
          </strong>
          , may be inaccurate, and must not be relied on as professional
          advice for production, safety-critical, or commercial decisions.
        </p>
      </LegalSection>

      <LegalSection heading="3. Accounts">
        <p>
          Sign-in is provided via Google through Clerk. You are responsible
          for activity under your account and for keeping access to your
          Google account secure. You must be at least 13 years old (or the
          minimum digital-consent age in your jurisdiction).
        </p>
      </LegalSection>

      <LegalSection heading="4. Your content">
        <p>
          You retain all rights to the code you submit. You grant us a
          limited license to process it to provide the Service (running
          analyses, storing what you choose to save). Only submit code you
          have the right to share — no proprietary code you are not permitted
          to disclose, and no secrets or credentials.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>break the law or infringe others&rsquo; rights via the Service;</li>
          <li>
            probe, overload, scrape, or disrupt the Service or circumvent its
            security and rate limits;
          </li>
          <li>submit malware or content designed to harm the Service or others;</li>
          <li>resell or misrepresent the Service as your own.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Availability and changes">
        <p>
          This is an early-access product offered free of charge. We may
          change, suspend, or discontinue any part of the Service at any time,
          and may set or change usage limits. We may update these Terms; the
          effective date above will change and continued use constitutes
          acceptance.
        </p>
      </LegalSection>

      <LegalSection heading="7. Disclaimer of warranties">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
          AVAILABLE&rdquo;, WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, ACCURACY, AND NON-INFRINGEMENT.
        </p>
      </LegalSection>

      <LegalSection heading="8. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM
          YOUR USE OF THE SERVICE. OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM
          RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF THE AMOUNT YOU
          PAID US IN THE PAST 12 MONTHS OR USD $10.
        </p>
      </LegalSection>

      <LegalSection heading="9. Indemnity">
        <p>
          You will indemnify us against claims arising from your content or
          your breach of these Terms, to the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection heading="10. Termination">
        <p>
          You may stop using the Service at any time and delete your data from
          Settings → Account. We may suspend or terminate access for breach of
          these Terms or to protect the Service. Sections 4 and 7–9 survive
          termination.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>
          Questions about these Terms:{" "}
          <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
