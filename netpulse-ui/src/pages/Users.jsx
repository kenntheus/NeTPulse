import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { useAuth } from '../store/AuthContext'
import { PageHeader, LoadingPage, EmptyState, ToastContainer } from '../components/ui'
import useToast from '../hooks/useToast'

const ROLE_BADGE = {
  admin:  'bg-purple-900/60 text-purple-300',
  viewer: 'bg-white/10 text-gray-300',
}

export default function Users() {
  const { user: me }              = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)
  const [confirm, setConfirm] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users')
      setUsers(data.data)
    } catch {
      addToast('Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = async (user, role) => {
    setSaving(user.id)
    try {
      const { data } = await api.patch(`/users/${user.id}/role`, { role })
      setUsers(u => u.map(x => x.id === user.id ? data.data : x))
      addToast(`${user.name}'s role updated to ${role}.`, 'success')
    } catch (err) {
      addToast(err?.response?.data?.message ?? 'Failed to update role.', 'error')
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (user) => {
    setConfirm(null)
    setSaving(user.id)
    try {
      await api.delete(`/users/${user.id}`)
      setUsers(u => u.filter(x => x.id !== user.id))
      addToast(`${user.name} deleted.`, 'success')
    } catch (err) {
      addToast(err?.response?.data?.message ?? 'Failed to delete user.', 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <LoadingPage />

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} account${users.length !== 1 ? 's' : ''} registered`}
      />

      {users.length === 0 ? (
        <EmptyState icon="👤" title="No users found" description="No accounts have been created yet." />
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b"
                style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--muted-bg)' }}>
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--card-border)' }}>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: 'var(--accent)' }}>
                        {user.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {user.name}
                          {user.id === me?.id && (
                            <span className="ml-2 text-xs text-gray-500">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${user.verified ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                      {user.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    {user.id === me?.id ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${ROLE_BADGE[user.role]}`}>
                        {user.role}
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        disabled={saving === user.id}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)', color: 'white' }}
                      >
                        <option value="viewer">viewer</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>

                  <td className="px-5 py-3 text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-3 text-right">
                    {user.id !== me?.id && (
                      confirm === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-400">Delete {user.name}?</span>
                          <button onClick={() => handleDelete(user)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium">Yes</button>
                          <button onClick={() => setConfirm(null)}
                            className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirm(user.id)}
                          disabled={saving === user.id}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                        >
                          Delete
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
