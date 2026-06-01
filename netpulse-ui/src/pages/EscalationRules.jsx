import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { PageHeader, LoadingPage, EmptyState, Button, ToastContainer } from '../components/ui'
import useToast from '../hooks/useToast'

const EMPTY_FORM = { webhook_id: '', delay_minutes: 30 }

export default function EscalationRules() {
  const { toasts, addToast, removeToast } = useToast()

  const [rules,    setRules]    = useState([])
  const [webhooks, setWebhooks] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [toggling, setToggling] = useState(null)
  const [confirm,  setConfirm]  = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [rulesRes, webhooksRes] = await Promise.all([
        api.get('/escalation-rules'),
        api.get('/webhooks'),
      ])
      setRules(rulesRes.data.data)
      setWebhooks(webhooksRes.data.data)
    } catch {
      addToast('Failed to load escalation rules.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.webhook_id) return
    setSaving(true)
    try {
      const { data } = await api.post('/escalation-rules', form)
      setRules(r => [...r, data.data])
      setForm(EMPTY_FORM)
      addToast('Escalation rule added.', 'success')
    } catch (err) {
      addToast(err?.response?.data?.message ?? 'Failed to add rule.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (rule) => {
    setToggling(rule.id)
    try {
      const { data } = await api.patch(`/escalation-rules/${rule.id}`, { enabled: !rule.enabled })
      setRules(r => r.map(x => x.id === rule.id ? data.data : x))
    } catch {
      addToast('Failed to update rule.', 'error')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (rule) => {
    setConfirm(null)
    try {
      await api.delete(`/escalation-rules/${rule.id}`)
      setRules(r => r.filter(x => x.id !== rule.id))
      addToast('Rule deleted.', 'success')
    } catch {
      addToast('Failed to delete rule.', 'error')
    }
  }

  if (loading) return <LoadingPage />

  const activeWebhooks = webhooks.filter(w => w.active)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Escalation Rules"
        subtitle="Re-fire a webhook if an offline alert remains unacknowledged past a time threshold"
      />

      {/* Add form */}
      <form onSubmit={handleAdd}
        className="rounded-xl border p-5 space-y-4"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <p className="text-sm font-semibold text-gray-200">Add escalation rule</p>

        {activeWebhooks.length === 0 ? (
          <p className="text-sm text-gray-400">
            You need at least one active webhook before adding escalation rules.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Webhook</label>
              <select
                value={form.webhook_id}
                onChange={e => setForm(f => ({ ...f, webhook_id: e.target.value }))}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--accent)/30"
                style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
              >
                <option value="">Select webhook…</option>
                {activeWebhooks.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">
                Escalate after (minutes)
                <span className="ml-1 text-gray-500">— if still unacknowledged</span>
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={form.delay_minutes}
                onChange={e => setForm(f => ({ ...f, delay_minutes: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-(--accent)/30"
                style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
              />
            </div>
          </div>
        )}

        {activeWebhooks.length > 0 && (
          <Button type="submit" loading={saving} disabled={!form.webhook_id}>
            Add rule
          </Button>
        )}
      </form>

      {/* Rules list */}
      {rules.length === 0 ? (
        <EmptyState
          icon="🔁"
          title="No escalation rules"
          description="Add a rule above to automatically re-notify a webhook when offline alerts go unacknowledged."
        />
      ) : (
        <ul className="space-y-3">
          {rules.map(rule => (
            <li
              key={rule.id}
              className="rounded-xl border px-5 py-4 flex items-center justify-between gap-4"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                opacity: rule.enabled ? 1 : 0.6,
              }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-white">{rule.webhook?.name ?? '—'}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${rule.enabled ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {rule.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Fires after <span className="font-mono font-medium text-white">{rule.delay_minutes} min</span> if device stays offline and unacknowledged
                </p>
                {rule.webhook?.url && (
                  <p className="text-xs font-mono text-gray-500 truncate mt-0.5">{rule.webhook.url}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleToggle(rule)}
                  disabled={toggling === rule.id}
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  {rule.enabled ? 'Pause' : 'Enable'}
                </button>

                {confirm === rule.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Delete?</span>
                    <button onClick={() => handleDelete(rule)} className="text-xs text-red-400 hover:text-red-300 font-medium">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-xs text-gray-500 hover:text-gray-300">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirm(rule.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
