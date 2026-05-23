import { useState } from 'react'
import { useWebhooks } from '../hooks/useWebhooks'
import useToast from '../hooks/useToast'
import { Button, PageHeader, EmptyState, LoadingPage, ToastContainer } from '../components/ui'

const ALL_EVENTS = ['offline', 'recovered', 'high_latency']
const EVENT_LABELS = { offline: '🔴 Offline', recovered: '🟢 Recovered', high_latency: '⚠️ High latency' }
const EMPTY_FORM = { name: '', url: '', events: ['offline', 'recovered', 'high_latency'], active: true }

export default function Webhooks() {
  const { webhooks, loading, addWebhook, updateWebhook, deleteWebhook, testWebhook } = useWebhooks()
  const { toasts, addToast, removeToast } = useToast()

  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [testing, setTesting] = useState(null)

  const toggleEvent = (event) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name || !form.url || form.events.length === 0) return
    setSaving(true)
    try {
      await addWebhook(form)
      setForm(EMPTY_FORM)
      addToast('Webhook added.', 'success')
    } catch (err) {
      addToast(err?.response?.data?.message ?? 'Failed to add webhook.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (webhook) => {
    try {
      await updateWebhook(webhook.id, { active: !webhook.active })
    } catch {
      addToast('Failed to update webhook.', 'error')
    }
  }

  const handleTest = async (webhook) => {
    setTesting(webhook.id)
    try {
      await testWebhook(webhook.id)
      addToast('Test payload sent!', 'success')
    } catch (err) {
      addToast(err?.response?.data?.message ?? 'Test failed.', 'error')
    } finally {
      setTesting(null)
    }
  }

  const handleDelete = async (webhook) => {
    try {
      await deleteWebhook(webhook.id)
      addToast('Webhook deleted.', 'success')
    } catch {
      addToast('Failed to delete webhook.', 'error')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Webhooks"
        subtitle="Send HTTP POST notifications when device alerts fire"
      />

      {/* Add form */}
      <form onSubmit={handleAdd} className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <p className="text-sm font-semibold text-gray-200">Add webhook</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Name</label>
            <input
              type="text"
              placeholder="e.g. Slack alerts"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">URL</label>
            <input
              type="url"
              placeholder="https://hooks.slack.com/…"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">Trigger on</p>
          <div className="flex flex-wrap gap-2">
            {ALL_EVENTS.map(event => (
              <button
                key={event}
                type="button"
                onClick={() => toggleEvent(event)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${form.events.includes(event) ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--card-border)] text-gray-400 hover:border-[var(--accent)]'}`}
              >
                {EVENT_LABELS[event]}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={saving} disabled={form.events.length === 0}>
          Add webhook
        </Button>
      </form>

      {/* Webhook list */}
      {loading ? <LoadingPage /> : webhooks.length === 0 ? (
        <EmptyState icon="🔗" title="No webhooks configured" description='Add a webhook above to get notified when device alerts fire.' />
      ) : (
        <ul className="space-y-3">
          {webhooks.map(webhook => (
            <li key={webhook.id} className="rounded-xl border px-5 py-4 flex items-start justify-between gap-4"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: webhook.active ? 1 : 0.6 }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white">{webhook.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${webhook.active ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {webhook.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-400 truncate mb-2">{webhook.url}</p>
                <div className="flex flex-wrap gap-1">
                  {(webhook.events ?? []).map(event => (
                    <span key={event} className="text-xs bg-[var(--muted-bg)] text-gray-300 px-2 py-0.5 rounded">
                      {EVENT_LABELS[event] ?? event}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleTest(webhook)}
                  disabled={testing === webhook.id}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                  title="Send test payload"
                >
                  {testing === webhook.id ? '…' : 'Test'}
                </button>
                <button
                  onClick={() => handleToggleActive(webhook)}
                  className="text-xs text-gray-400 hover:text-white"
                  title={webhook.active ? 'Disable' : 'Enable'}
                >
                  {webhook.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(webhook)}
                  className="text-xs text-red-400 hover:text-red-300"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
