import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-brand-500 font-mono text-sm mb-4">404</p>
        <h1 className="text-4xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}