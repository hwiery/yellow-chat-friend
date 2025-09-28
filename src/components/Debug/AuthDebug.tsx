import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

const AuthDebug = () => {
  const { user, userProfile, session, loading } = useAuth()
  const [showDebug, setShowDebug] = useState(false)

  // Only show in development
  if (import.meta.env.MODE === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-800 text-white px-3 py-2 rounded text-sm"
      >
        🐛 Debug
      </button>

      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm w-96 max-h-96 overflow-auto text-xs">
          <h3 className="font-bold mb-2">Auth Debug Info</h3>

          <div className="space-y-2">
            <div>
              <strong>Loading:</strong> {loading ? 'true' : 'false'}
            </div>

            <div>
              <strong>User:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {user ? JSON.stringify({
                  id: user.id,
                  email: user.email,
                  created_at: user.created_at,
                  user_metadata: user.user_metadata
                }, null, 2) : 'null'}
              </pre>
            </div>

            <div>
              <strong>User Profile:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {userProfile ? JSON.stringify(userProfile, null, 2) : 'null'}
              </pre>
            </div>

            <div>
              <strong>Session:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {session ? JSON.stringify({
                  access_token: session.access_token?.substring(0, 20) + '...',
                  expires_at: session.expires_at,
                  expires_in: session.expires_in,
                  user: session.user?.email
                }, null, 2) : 'null'}
              </pre>
            </div>

            <div>
              <strong>URL:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto text-xs">
                {window.location.href}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthDebug