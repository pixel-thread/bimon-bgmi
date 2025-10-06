"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-8">
              Privacy Policy
            </h1>

            <div className="text-slate-600 dark:text-slate-400 space-y-6">
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Last updated: December 2024
              </p>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  1. Information We Collect
                </h2>
                <p className="mb-4">
                  We collect information you provide directly to us when using
                  our PUBG Mobile and BGMI tournament management platform:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Account Information:</strong> Email address,
                    username, and authentication data through Google Sign-In
                  </li>
                  <li>
                    <strong>Gaming Information:</strong> In-game names (IGN),
                    team affiliations, tournament participation data
                  </li>
                  <li>
                    <strong>Performance Data:</strong> Match statistics,
                    kill/death ratios, tournament scores, and gameplay analytics
                  </li>
                  <li>
                    <strong>Usage Information:</strong> How you interact with
                    our platform, pages visited, and feature usage
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Provide and maintain our tournament management services
                  </li>
                  <li>
                    Track tournament participation and calculate performance
                    statistics
                  </li>
                  <li>Enable team formation and player authentication</li>
                  <li>Display leaderboards and tournament results</li>
                  <li>Facilitate voting and community features</li>
                  <li>Improve our platform and develop new features</li>
                  <li>
                    Communicate with you about tournaments and platform updates
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  3. Information Sharing and Disclosure
                </h2>
                <p className="mb-4">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Tournament Display:</strong> Your gaming statistics,
                    team information, and tournament performance are displayed
                    publicly within the platform
                  </li>
                  <li>
                    <strong>Tournament Organizers:</strong> Authorized
                    tournament administrators can access participant information
                    necessary for tournament management
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or
                    to protect our rights and safety
                  </li>
                  <li>
                    <strong>Service Providers:</strong> With trusted third-party
                    services that help us operate our platform (like Firebase
                    for authentication and data storage)
                  </li>
                </ul>
                <p className="mt-4">
                  We do not sell, rent, or trade your personal information to
                  third parties for marketing purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  4. Data Security
                </h2>
                <p>
                  We implement appropriate security measures to protect your
                  information, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Secure authentication through Google Sign-In</li>
                  <li>Encrypted data transmission and storage</li>
                  <li>Role-based access controls for sensitive information</li>
                  <li>Regular security updates and monitoring</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  5. Your Rights and Choices
                </h2>
                <p className="mb-4">
                  You have the following rights regarding your information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Access:</strong> View your tournament data and
                    statistics through your account
                  </li>
                  <li>
                    <strong>Correction:</strong> Update your profile information
                    and gaming details
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request removal of your account
                    and associated data
                  </li>
                  <li>
                    <strong>Withdrawal:</strong> Stop participating in
                    tournaments at any time
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  6. Cookies and Tracking
                </h2>
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Provide personalized tournament experiences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  7. Third-Party Services
                </h2>
                <p className="mb-4">
                  Our platform integrates with third-party services:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Google Services:</strong> For authentication and
                    account management
                  </li>
                  <li>
                    <strong>Firebase:</strong> For data storage and real-time
                    updates
                  </li>
                  <li>
                    <strong>Google AdSense:</strong> For displaying relevant
                    advertisements
                  </li>
                </ul>
                <p className="mt-4">
                  These services have their own privacy policies, and we
                  encourage you to review them.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  8. Children's Privacy
                </h2>
                <p>
                  Our platform is designed for users aged 13 and older. We do
                  not knowingly collect personal information from children under
                  13. If you believe we have collected information from a child
                  under 13, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  9. International Users
                </h2>
                <p>
                  Our platform is hosted and operated from various locations. By
                  using our services, you consent to the transfer and processing
                  of your information in countries where our servers are
                  located.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  10. Changes to This Policy
                </h2>
                <p>
                  We may update this privacy policy from time to time. We will
                  notify users of significant changes by posting the updated
                  policy on our platform and updating the "Last updated" date
                  above.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  11. Contact Us
                </h2>
                <p className="mb-4">
                  If you have questions about this privacy policy or our data
                  practices, please contact us:
                </p>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p>
                    <strong>Email:</strong> privacy@pubgmi-tournament.com
                  </p>
                  <p>
                    <strong>Platform:</strong> Through the contact form in your
                    account dashboard
                  </p>
                </div>
              </section>

              <section className="border-t border-slate-200 dark:border-slate-600 pt-6">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Gaming-Specific Privacy Notes
                </h2>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Tournament Data Visibility
                  </h3>
                  <p className="text-sm">
                    Please note that tournament participation involves public
                    display of gaming statistics, team affiliations, and
                    performance data. This information is visible to other
                    tournament participants and spectators as part of the
                    competitive gaming experience.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
