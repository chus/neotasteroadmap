'use client'

import { useState } from 'react'
import { createKeyAccount, updateKeyAccount, deleteKeyAccount, updateKeyAccountPositions } from '@/app/actions'
import KeyAccountModal from './KeyAccountModal'
import type { KeyAccount } from '@/types'

interface Props {
  initialAccounts: KeyAccount[]
}

export default function KeyAccountsManager({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<KeyAccount[]>(initialAccounts)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<KeyAccount | null>(null)

  async function handleAdd(data: { name: string; company: string; logo_url: string }) {
    const account = await createKeyAccount(data)
    setAccounts((prev) => [...prev, account])
    setShowModal(false)
  }

  async function handleEdit(data: { name: string; company: string; logo_url: string }) {
    if (!editingAccount) return
    await updateKeyAccount(editingAccount.id, data)
    setAccounts((prev) =>
      prev.map((a) => (a.id === editingAccount.id ? { ...a, ...data } : a))
    )
    setEditingAccount(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this key account?')) return
    await deleteKeyAccount(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  async function moveUp(index: number) {
    if (index === 0) return
    const updated = [...accounts]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    const reordered = updated.map((a, i) => ({ ...a, position: i }))
    setAccounts(reordered)
    await updateKeyAccountPositions(reordered.map((a) => ({ id: a.id, position: a.position })))
  }

  async function moveDown(index: number) {
    if (index === accounts.length - 1) return
    const updated = [...accounts]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    const reordered = updated.map((a, i) => ({ ...a, position: i }))
    setAccounts(reordered)
    await updateKeyAccountPositions(reordered.map((a) => ({ id: a.id, position: a.position })))
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-neutral-800">Key accounts</h2>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            Track key customer dependencies that influence the roadmap.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700"
        >
          Add account
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-[12px] text-neutral-400 italic">No key accounts yet.</p>
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-left">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, idx) => (
                <tr key={account.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2 text-neutral-700 font-medium">{account.name}</td>
                  <td className="px-3 py-2 text-neutral-500">{account.company || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 px-1"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === accounts.length - 1}
                        className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 px-1"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingAccount(account)}
                        className="text-neutral-400 hover:text-neutral-600 px-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-400 hover:text-red-600 px-1"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <KeyAccountModal
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}

      {editingAccount && (
        <KeyAccountModal
          account={editingAccount}
          onSave={handleEdit}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </section>
  )
}
