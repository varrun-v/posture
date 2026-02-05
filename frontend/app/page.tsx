export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Posture Monitor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Real-time posture tracking and break reminders for a healthier work life
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Real-time Detection
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Uses your webcam to monitor posture in real-time
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Smart Alerts
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get notified when slouching or sitting too long
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your posture habits over time
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-colors">
            Start Monitoring
          </button>

          {/* Status */}
          <div className="mt-12 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md inline-block">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Backend Status: <span className="text-green-600 font-semibold">Checking...</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

