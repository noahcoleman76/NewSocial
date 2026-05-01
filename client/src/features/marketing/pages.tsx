import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logoGold from '@/assets/logo-gold.png';

const MarketingFooter = () => (
  <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[var(--text)]/50">
    <p>© {new Date().getFullYear()} NewSocial</p>
    <div className="flex gap-4">
      <Link className="transition hover:text-[var(--accent)]" to="/terms">
        Terms
      </Link>
      <Link className="transition hover:text-[var(--accent)]" to="/privacy">
        Privacy
      </Link>
    </div>
  </footer>
);

const PublicShell = ({ children }: { children: ReactNode }) => (
  <main className="min-h-screen px-4 py-8 text-[var(--text)]">
    <div className="mx-auto max-w-6xl">{children}</div>
  </main>
);

export const LandingPage = () => (
  <PublicShell>
    <header className="flex items-center justify-between gap-4">
      <Link className="flex items-center gap-3" to="/">
        <img alt="NewSocial" className="h-12 w-auto object-contain" src={logoGold} />
        <span className="text-sm font-semibold tracking-[0.22em]">NEWSOCIAL</span>
      </Link>
      <div className="flex gap-3">
        <Link className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10" to="/login">
          Log in
        </Link>
        <Link
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
          to="/register"
        >
          Sign up
        </Link>
      </div>
    </header>

    <section className="grid items-center gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-5 inline-flex rounded-full border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
          Private by design
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-[var(--text)] md:text-7xl">
          Social connection without the noise.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text)]/68">
          NewSocial is a private family-aware network built for real updates, safer child accounts, and calm communication.
          No public discovery, no algorithmic feed, no endless scroll.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
            to="/register"
          >
            Create account
          </Link>
          <Link
            className="rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-[var(--text)]/85 transition hover:bg-white/10"
            to="/login"
          >
            Log in
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[var(--bg-card)]/80 p-5 shadow-[var(--shadow-glow)]">
        <div className="rounded-[1.5rem] border border-white/10 bg-[var(--bg-elevated)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text)]/45">Today</p>
          <div className="mt-5 space-y-4">
            {['Chronological posts from people you know', 'Parent visibility for child accounts', 'Messages only between connections'].map((item) => (
              <div key={item} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-[var(--text)]/78">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[var(--text)]/50">You're caught up.</p>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      {[
        ['Private circles', 'Posts stay visible to mutual connections, not the public internet.'],
        ['Family oversight', 'Parents can manage child connections and review child message activity.'],
        ['Calm feed', 'Chronological updates with clear stopping points and no recommendation engine.'],
      ].map(([title, body]) => (
        <article key={title} className="rounded-[1.5rem] border border-white/10 bg-[var(--bg-card)]/75 p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text)]/64">{body}</p>
        </article>
      ))}
    </section>

    <MarketingFooter />
  </PublicShell>
);

const legalSections = {
  terms: {
    title: 'Terms & Conditions',
    intro:
      'These Terms govern access to and use of NewSocial, a private, family-aware social platform designed for calm sharing, connection-based messaging, and parent-managed child account oversight.',
    sections: [
      {
        title: '1. Acceptance of these Terms',
        body: [
          'By creating an account, accessing NewSocial, or using any NewSocial feature, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.',
          'If you use NewSocial on behalf of a child or family member, you confirm that you have the authority to manage that account and make decisions for that user where required by law.',
        ],
      },
      {
        title: '2. Eligibility and account types',
        body: [
          'NewSocial supports standard accounts, child accounts linked to a family manager, and administrator accounts. Standard accounts may manage child accounts by sharing a family code during account creation.',
          'Child accounts are managed accounts. A family manager can review child messages, manage child connections, approve or reject certain child connections, release a child account to a standard account, or delete a child account.',
          'You may not create an account using false information, impersonate another person, or create an account for someone else unless you have authority to do so.',
        ],
      },
      {
        title: '3. Child accounts and parent or family-manager authority',
        body: [
          'Family managers are responsible for deciding whether a child may use NewSocial and for supervising that child account. Child accounts may not remove their family-manager relationship on their own.',
          'When a child account connects with another account, the family manager may be required to approve the connection before the child can view the connected account posts or interact as a fully connected user.',
          'Family managers can view full profiles and posts of accounts connected to, or pending approval for, their managed child accounts so they can make informed safety decisions.',
          'If NewSocial is used by children under 13, the service must be operated in a way that complies with the Children’s Online Privacy Protection Act and Rule, including appropriate parental notice, consent, access, and deletion rights.',
        ],
      },
      {
        title: '4. Private-network product rules',
        body: [
          'NewSocial is intentionally not a public discovery platform. There are no public follower counts, public recommendation feeds, trending modules, read receipts, typing indicators, or infinite-scroll engagement mechanics.',
          'Feeds are chronological and connection-based. Posts may appear in feeds only under the visibility rules implemented by the service, including mutual connection and family oversight rules.',
          'Messaging is limited to mutually connected users, subject to child-account and family-manager rules.',
        ],
      },
      {
        title: '5. Your content and license to operate the service',
        body: [
          'You own the content you post or upload, subject to any rights held by others. This includes profile information, posts, comments, messages, and images.',
          'You grant NewSocial a limited, non-exclusive, worldwide license to host, store, display, transmit, reproduce, and process your content only as needed to operate, secure, moderate, improve, and provide the service.',
          'You are responsible for the content you submit and must have the rights needed to share it.',
        ],
      },
      {
        title: '6. Acceptable use',
        body: [
          'You may not use NewSocial to harass, threaten, exploit, abuse, impersonate, defraud, stalk, or harm another person.',
          'You may not upload or share illegal content, sexually exploitative content, non-consensual intimate content, hateful or violent threats, malware, spam, or content that violates another person’s privacy or intellectual property rights.',
          'You may not attempt to bypass family oversight controls, access another user’s account, scrape the service, reverse engineer private APIs, interfere with service security, or use automation to abuse the platform.',
        ],
      },
      {
        title: '7. Reports, moderation, and account enforcement',
        body: [
          'Users may report accounts and posts. Administrators may review reports and may remove posts, disable accounts, re-enable accounts, or take other safety actions supported by the service.',
          'A disabled account cannot use normal app features and may be hidden from search, feeds, messages, connection lists, and profile access except where administrator access is needed.',
          'Account deletion may permanently remove profile information, posts, connections, messages, uploaded files, and related records according to the product’s deletion rules. Some safety, security, audit, or legal records may be retained if legally permitted or required.',
        ],
      },
      {
        title: '8. No emergency or professional use',
        body: [
          'NewSocial is not an emergency service, crisis service, child-protection agency, law-enforcement reporting tool, medical tool, or professional advisory service.',
          'If you believe someone is in immediate danger, contact emergency services or the appropriate authority in your area.',
        ],
      },
      {
        title: '9. Service availability and changes',
        body: [
          'NewSocial may change, suspend, limit, or discontinue features as the product evolves. We may also impose limits to protect safety, privacy, security, or service reliability.',
          'We try to keep the service available, but we do not guarantee uninterrupted, error-free, or permanent availability of any feature or content.',
        ],
      },
      {
        title: '10. Disclaimers',
        body: [
          'The service is provided on an “as is” and “as available” basis to the fullest extent permitted by law.',
          'We do not promise that the service will meet every user expectation, prevent every harmful interaction, or identify every safety issue.',
        ],
      },
      {
        title: '11. Limitation of liability',
        body: [
          'To the fullest extent permitted by law, NewSocial and its operators will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, data, goodwill, or other intangible losses arising from use of the service.',
          'Some jurisdictions do not allow certain limitations, so parts of this section may not apply to every user.',
        ],
      },
      {
        title: '12. Termination',
        body: [
          'You may stop using NewSocial at any time. Eligible users may delete their own accounts from the app. Child accounts may be deleted or released only by the family manager according to the family-account rules.',
          'We may suspend, disable, or terminate access if we believe these Terms, the Privacy Policy, safety rules, or applicable law have been violated.',
        ],
      },
      {
        title: '13. Changes to these Terms',
        body: [
          'We may update these Terms as the product, law, or safety practices change. If changes are material, we will provide notice through the app or another reasonable method before the changes take effect where required by law.',
          'Continued use of NewSocial after updated Terms take effect means you accept the updated Terms.',
        ],
      },
      {
        title: '14. Contact',
        body: [
          'Questions about these Terms can be sent to support@newsocial.app. Replace this address with the official support or legal contact before public launch.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This Privacy Policy explains how NewSocial collects, uses, shares, protects, and retains information for a private, family-aware social platform.',
    sections: [
      {
        title: '1. Information we collect',
        body: [
          'Account information: name or display name, username, email address, password hash, role, account status, family-manager relationship, family code use, and authentication/session records.',
          'Profile information: bio, profile picture, profile edits, and other settings you choose to provide.',
          'Content and interactions: posts, post images, comments, likes, connection requests, active connections, messages, message images, notifications, reports, moderation actions, and admin audit logs.',
          'Technical information: IP address, device/browser information, log data, timestamps, cookie/session identifiers, upload metadata, and security-related events.',
        ],
      },
      {
        title: '2. How we use information',
        body: [
          'We use information to create and secure accounts, authenticate users, provide feeds, profiles, posts, comments, messages, notifications, reports, family oversight tools, and administrator moderation tools.',
          'We use information to enforce connection visibility rules, child-account restrictions, parent approval flows, disabled-account restrictions, and account deletion rules.',
          'We may use information to prevent abuse, investigate reports, debug errors, maintain service reliability, comply with legal obligations, and improve core product functionality.',
        ],
      },
      {
        title: '3. Family and child account privacy',
        body: [
          'Child accounts are linked to a family manager. The family manager can view child messages, manage child connections, review accounts connected to or pending approval for the child, release the child account, or delete the child account.',
          'Child accounts cannot remove the family-manager relationship on their own. This is a core safety and oversight feature of NewSocial.',
          'If NewSocial has actual knowledge that it collects personal information from children under 13, it must comply with COPPA, including parental notice, verifiable parental consent where required, parental access, deletion, and limits on collection and use.',
        ],
      },
      {
        title: '4. How information is shared in the app',
        body: [
          'Profile search results may show profile picture, display name, and username. Non-connections may see only basic profile information unless another visibility rule applies.',
          'Mutual connections can see full profiles and posts according to the app’s visibility rules. Family managers can see child account activity and certain connected or pending-approval account profiles for safety review.',
          'Messages are visible to conversation participants and, for child accounts, the family manager. Administrators may access reports and related records where needed for moderation and safety.',
        ],
      },
      {
        title: '5. External sharing and service providers',
        body: [
          'We do not sell personal information as that term is commonly used in privacy laws. We do not operate a public advertising marketplace in the MVP.',
          'We may share information with service providers that help operate the app, such as hosting, database, storage, email, security, logging, analytics, or customer support providers. Service providers should process information only for authorized purposes.',
          'We may disclose information if required by law, legal process, safety obligations, enforcement of our Terms, protection of users, or protection of NewSocial rights and security.',
        ],
      },
      {
        title: '6. Cookies, sessions, and authentication',
        body: [
          'NewSocial uses authentication tokens, refresh sessions, cookies, or similar technologies to keep users signed in, protect accounts, prevent fraud, and operate the service.',
          'The MVP does not require behavioral advertising cookies. If analytics or advertising tools are added later, this policy should be updated before launch of those tools.',
        ],
      },
      {
        title: '7. Photos and uploads',
        body: [
          'Uploaded images may include profile pictures, post images, and message images. Images are stored through the app’s file storage service and associated with the relevant account, post, or message.',
          'Users should not upload images they do not have the right to share or images that violate another person’s privacy or safety.',
        ],
      },
      {
        title: '8. Data retention and deletion',
        body: [
          'We retain information for as long as needed to provide the service, maintain safety and security, comply with legal obligations, resolve disputes, and enforce our Terms.',
          'Account deletion is designed to remove account identity, posts, connections, messages, profile data, and related content according to the product’s deletion behavior. Disabled accounts are hidden and non-interactive but retained unless deleted.',
          'Some records may be retained where required or permitted for security, legal compliance, fraud prevention, audit logs, backups, or report handling. Backup copies may take additional time to expire.',
        ],
      },
      {
        title: '9. Your choices and rights',
        body: [
          'Users may edit profile information, change passwords, upload or replace profile photos, delete eligible posts/comments, and delete eligible accounts through the app.',
          'Family managers may request or perform child-account deletion or release according to the app’s family rules.',
          'Depending on where you live, you may have rights to access, correct, delete, export, or limit use of personal information, or to appeal certain privacy decisions. To exercise privacy rights, contact support@newsocial.app. Replace this address with the official privacy contact before launch.',
        ],
      },
      {
        title: '10. State privacy rights',
        body: [
          'Some U.S. state privacy laws, including California privacy laws, may require additional notices about categories of personal information, purposes of use, sharing, retention, and user rights.',
          'If NewSocial meets thresholds under any state privacy law, the public launch policy should include all required state-specific notices and request workflows.',
        ],
      },
      {
        title: '11. Security',
        body: [
          'We use technical and organizational safeguards designed to protect accounts and data, such as password hashing, authenticated API access, role checks, account-state enforcement, upload validation, and limited child-account permissions.',
          'No online service can guarantee perfect security. Users should use strong passwords and protect account access.',
        ],
      },
      {
        title: '12. International users',
        body: [
          'NewSocial is currently designed for U.S.-based operation unless otherwise stated. If you access the service from another country, your information may be processed in the United States or other locations where service providers operate.',
          'Additional legal terms may be required before offering the service in jurisdictions with specific privacy or child-safety laws.',
        ],
      },
      {
        title: '13. Changes to this Privacy Policy',
        body: [
          'We may update this Privacy Policy as the product, data practices, service providers, or legal requirements change. Material changes will be communicated through the app or another reasonable method where required by law.',
        ],
      },
      {
        title: '14. Contact',
        body: [
          'Questions or privacy requests can be sent to support@newsocial.app. Replace this address with the official support, privacy, or legal contact before public launch.',
        ],
      },
    ],
  },
} as const;
const LegalPage = ({ kind }: { kind: 'terms' | 'privacy' }) => {
  const content = legalSections[kind];

  return (
    <PublicShell>
      <header className="flex items-center justify-between gap-4">
        <Link className="flex items-center gap-3" to="/">
          <img alt="NewSocial" className="h-10 w-auto object-contain" src={logoGold} />
          <span className="text-sm font-semibold tracking-[0.22em]">NEWSOCIAL</span>
        </Link>
        <Link className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10" to="/login">
          Log in
        </Link>
      </header>
      <section className="mx-auto mt-14 max-w-3xl rounded-[2rem] border border-white/10 bg-[var(--bg-card)]/80 p-8">
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">{content.title}</h1>
        <p className="mt-4 leading-8 text-[var(--text)]/64">{content.intro}</p>
        <div className="mt-8 space-y-6">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-[var(--accent)]">{section.title}</h2>
              <div className="mt-2 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="leading-7 text-[var(--text)]/68">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </PublicShell>
  );
};

export const TermsPage = () => <LegalPage kind="terms" />;

export const PrivacyPage = () => <LegalPage kind="privacy" />;


