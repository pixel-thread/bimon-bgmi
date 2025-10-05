export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-8">
              Contact Us
            </h1>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Get in Touch
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Have questions about our tournament platform? Need support
                  with your tournament? We're here to help the PUBG Mobile and
                  BGMI gaming community.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Email
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        bimonlangnongsiej@gmail.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Response Time
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Support Categories
                </h2>

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      Tournament Support
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Help with organizing tournaments, team management, and
                      scoring systems.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      Technical Issues
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Platform bugs, login problems, or feature requests.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      General Inquiries
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Questions about our platform, partnerships, or community
                      features.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Community Guidelines
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We're committed to maintaining a positive gaming community.
                Please ensure all communications follow our community guidelines
                and respect other players.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
