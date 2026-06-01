import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '📡',
    title: 'Real-Time Monitoring',
    description: 'Ping every device on a configurable interval and get instant status updates — online, offline, or degraded.',
  },
  {
    icon: '🔺',
    title: 'AI Anomaly Detection',
    description: 'Statistical baselines per device. Get alerted when latency spikes beyond normal variance — not just when it goes offline.',
  },
  {
    icon: '🗺️',
    title: 'Topology Map',
    description: 'Visual network graph that groups devices by subnet and shows live connection status at a glance.',
  },
  {
    icon: '🧬',
    title: 'Device Fingerprinting',
    description: 'AI classifies each device by behaviour — server, router, phone — and flags mismatches with the recorded type.',
  },
  {
    icon: '🔔',
    title: 'Webhook Alerts',
    description: 'Fire HTTP POST payloads to Slack, Discord, or any URL the moment an alert triggers.',
  },
  {
    icon: '📋',
    title: 'Audit Log',
    description: 'Full tamper-evident record of every login, device change, and configuration event across your team.',
  },
  {
    icon: '🛡️',
    title: 'Two-Factor Auth',
    description: 'TOTP-based 2FA with any authenticator app. Email verification on first login for every new account.',
  },
  {
    icon: '🎨',
    title: 'Customisable Themes',
    description: 'Six built-in colour themes — Midnight, Ocean, Forest, Amethyst, Ember, Cherry — plus a resizable dashboard.',
  },
]

const STATS = [
  { value: '< 1s',  label: 'Alert latency' },
  { value: '100+',  label: 'Devices supported' },
  { value: '6',     label: 'Colour themes' },
  { value: '24/7',  label: 'Uptime tracking' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">N</div>
            <span className="font-semibold tracking-tight">NeTPulse</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 border border-blue-800/60 bg-blue-950/40 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Network monitoring — simplified
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight text-white">
            Know your network.<br />
            <span className="text-blue-400">Before it breaks.</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            NeTPulse monitors every device on your network in real time, detects anomalies with AI,
            and alerts you the moment something goes wrong — so you fix it before your users notice.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started free
            </Link>
            <Link
              to="/login"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-7 py-3 rounded-xl text-sm transition-all"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-800/60 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Everything you need</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
              From basic ping monitoring to AI-driven insights — NeTPulse covers the full lifecycle
              of network observability in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3 hover:border-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl">
                  {icon}
                </div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-900/40 border-y border-gray-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Up and running in minutes</h2>
            <p className="text-gray-400 text-sm">No agents, no installs — just add your devices and go.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create an account', body: 'Register, verify your email, and complete the one-time setup wizard.' },
              { step: '2', title: 'Add your devices', body: 'Enter an IP address, pick a device type, and NeTPulse starts monitoring immediately.' },
              { step: '3', title: 'Stay in the loop', body: 'Check the live dashboard, set up webhooks, and let AI surface anomalies for you.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold text-white">Ready to monitor smarter?</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Join NeTPulse and get full visibility into your network infrastructure — for free.
          </p>
          <Link
            to="/register"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800/60 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">N</div>
            <span>NeTPulse</span>
          </div>
          <div className="flex gap-5">
            <Link to="/login"    className="hover:text-gray-300 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-gray-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
