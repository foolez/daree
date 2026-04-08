import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy – Daree",
  description:
    "How Daree collects, uses, and protects your information. Social accountability challenges with transparency."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-2xl px-5 py-10 pb-16">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] transition-colors hover:text-white"
        >
          <span aria-hidden>←</span> Back
        </Link>

        <header className="mt-8 border-b border-[#1E1E1E] pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">Daree — social accountability challenges</p>
          <p className="mt-4 text-sm text-[#888888]">
            <span className="font-medium text-[#A3A3A3]">Last updated:</span> April 2026
          </p>
        </header>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed">
          <p className="text-[#A3A3A3]">
            Daree (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy. This Privacy Policy
            explains what information we collect when you use the Daree mobile and web application
            (the &quot;Service&quot;), how we use it, and your choices. By using Daree, you agree to this
            policy.
          </p>

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">
              Information We Collect
            </h2>
            <p className="mb-3 text-[#C4C4C4]">
              We collect information you provide and information generated when you use the Service,
              including:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-[#C4C4C4]">
              <li>
                <strong className="text-white">Account information:</strong> email address, username,
                and profile photo (if you upload one).
              </li>
              <li>
                <strong className="text-white">Content you post:</strong> vlogs, photos, and other
                proof you submit as part of challenges (collectively, &quot;posts&quot;).
              </li>
              <li>
                <strong className="text-white">Challenge data:</strong> dare titles, participation,
                invites, streaks, points, leaderboards, reactions, and related activity tied to your
                account.
              </li>
              <li>
                <strong className="text-white">Technical data:</strong> device type, app version,
                and similar diagnostics as needed to operate and secure the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">
              How We Use It
            </h2>
            <p className="mb-3 text-[#C4C4C4]">We use this information to:</p>
            <ul className="list-disc space-y-2 pl-5 text-[#C4C4C4]">
              <li>Create and manage your account and profile.</li>
              <li>Run challenges, feeds, leaderboards, and social accountability features.</li>
              <li>Deliver notifications and in-app experiences you expect from Daree.</li>
              <li>Improve reliability, security, and product quality.</li>
              <li>Comply with law and enforce our terms when necessary.</li>
            </ul>
            <p className="mt-4 text-[#C4C4C4]">
              We do <strong className="text-white">not</strong> sell your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">
              Data Storage
            </h2>
            <p className="text-[#C4C4C4]">
              Daree uses{" "}
              <strong className="text-white">Supabase</strong> for authentication, database storage, and
              related infrastructure. Your data may be processed and stored on Supabase systems in
              accordance with their security practices and our configuration. We take reasonable steps
              to protect your information, but no method of transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">
              Your Rights
            </h2>
            <p className="mb-3 text-[#C4C4C4]">
              Depending on where you live, you may have rights to access, correct, or delete certain
              personal data, or to object to or restrict certain processing. You can update some
              information in the app where available.
            </p>
            <p className="text-[#C4C4C4]">
              To <strong className="text-white">delete your account</strong> and request removal of
              associated personal data, email us at{" "}
              <a
                href="mailto:dareapp@gmail.com"
                className="font-medium text-[#00FF88] underline decoration-[#00FF88]/40 underline-offset-2 hover:decoration-[#00FF88]"
              >
                dareapp@gmail.com
              </a>
              . We will process verified requests in line with applicable law and our operational
              capabilities (some information may be retained where required by law or for legitimate
              business needs, such as security logs).
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">
              Children&apos;s Privacy
            </h2>
            <p className="text-[#C4C4C4]">
              Daree is not intended for children under{" "}
              <strong className="text-white">13</strong>. We do not knowingly collect personal
              information from anyone under 13. If you believe we have collected information from a child
              under 13, please contact us and we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">
              Contact Us
            </h2>
            <p className="text-[#C4C4C4]">
              Questions about this Privacy Policy or Daree&apos;s data practices? Contact us at{" "}
              <a
                href="mailto:dareapp@gmail.com"
                className="font-medium text-[#00FF88] underline decoration-[#00FF88]/40 underline-offset-2 hover:decoration-[#00FF88]"
              >
                dareapp@gmail.com
              </a>
              .
            </p>
          </section>

          <p className="border-t border-[#1E1E1E] pt-8 text-sm text-[#6B6B6B]">
            We may update this Privacy Policy from time to time. We will post the revised policy on this
            page and update the &quot;Last updated&quot; date above.
          </p>
        </div>
      </div>
    </main>
  );
}
