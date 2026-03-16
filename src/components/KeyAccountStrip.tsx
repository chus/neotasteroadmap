'use client'

import { useState, useRef, useEffect } from 'react'
import KeyAccountModal from './KeyAccountModal'
import {
  updateKeyAccount,
  deleteKeyAccount,
  unlinkKeyAccountInitiative,
  linkKeyAccountInitiative,
} from '@/app/actions'
import type { Initiative, KeyAccount, KeyAccountInitiative } from '@/types'

interface Props {
  account: KeyAccount
  linkedInitiatives: Initiative[]
  allInitiatives: Initiative[]
  links: KeyAccountInitiative[]
  onCardClick: (initiative: Initiative) => void
  onAccountUpdate: (updated: KeyAccount) => void
  onAccountDelete: (id: string) => void
  onLinkChange: (accountId: string, links: KeyAccountInitiative[]) => void
}

export default function KeyAccountStrip({
  account,
  linkedInitiatives,
  allInitiatives,
  links,
  onCardClick,
  onAccountUpdate,
  onAccountDelete,
  onLinkChange,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [showLinkSearch, setShowLinkSearch] = useState(false)
  const [linkQuery, setLinkQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const linkedIds = new Set(linkedInitiatives.map((i) => i.id))

  // Close link search on click outside
  useEffect(() => {
    if (!showLinkSearch) return
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowLinkSearch(false)
        setLinkQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showLinkSearch])

  // Focus search input when opened
  useEffect(() => {
    if (showLinkSearch && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showLinkSearch])

  async function handleUnlink(initiativeId: string) {
    await unlinkKeyAccountInitiative(account.id, initiativeId)
    const updated = links.filter(
      (l) => !(l.key_account_id === account.id && l.initiative_id === initiativeId)
    )
    onLinkChange(account.id, updated)
  }

  async function handleLink(initiativeId: string) {
    await linkKeyAccountInitiative(account.id, initiativeId)
    const newLink: KeyAccountInitiative = {
      id: crypto.randomUUID(),
      key_account_id: account.id,
      initiative_id: initiativeId,
      note: '',
      created_at: new Date(),
    }
    onLinkChange(account.id, [...links, newLink])
    setShowLinkSearch(false)
    setLinkQuery('')
  }

  async function handleDelete() {
    if (!confirm(`Delete key account "${account.name}"? This will remove all initiative links.`)) return
    await deleteKeyAccount(account.id)
    onAccountDelete(account.id)
  }

  const searchResults = linkQuery.trim()
    ? allInitiatives
        .filter((i) => i.title.toLowerCase().includes(linkQuery.toLowerCase()))
        .slice(0, 8)
    : []

  return (
    <>
      <div className="group/strip flex items-center gap-3 px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50">
        {/* Account info */}
        <div className="flex items-center gap-2 shrink-0 min-w-[140px]">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[12px] font-medium text-neutral-700 truncate">{account.name}</span>
          {account.company && (
            <span className="text-[10px] text-neutral-400">{account.company}</span>
          )}
        </div>

        {/* Linked initiative pills */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {linkedInitiatives.map((init) => (
            <div key={init.id} className="group/pill flex items-center">
              <button
                onClick={() => onCardClick(init)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-l bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400 truncate max-w-[200px]"
              >
                {init.title}
              </button>
              <button
                onClick={() => handleUnlink(init.id)}
                title="Unlink from this key account"
                className="text-[11px] px-1 py-0.5 rounded-r bg-white border border-l-0 border-neutral-200 text-neutral-300 hover:text-red-500 hover:border-red-300 opacity-0 group-hover/strip:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Link initiative button */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setShowLinkSearch(!showLinkSearch)}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 px-1.5 py-0.5 rounded border border-dashed border-neutral-300 hover:border-neutral-400 opacity-0 group-hover/strip:opacity-100 transition-opacity"
            >
              + Link
            </button>
            {showLinkSearch && (
              <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-neutral-200 rounded-lg shadow-lg z-30 p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={linkQuery}
                  onChange={(e) => setLinkQuery(e.target.value)}
                  placeholder="Search initiatives..."
                  className="w-full text-[12px] border border-neutral-200 rounded px-2 py-1.5 outline-none focus:border-neutral-400 mb-1"
                />
                {searchResults.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                    {searchResults.map((init) => {
                      const alreadyLinked = linkedIds.has(init.id)
                      return (
                        <button
                          key={init.id}
                          onClick={() => !alreadyLinked && handleLink(init.id)}
                          disabled={alreadyLinked}
                          className="w-full text-left text-[11px] px-2 py-1.5 rounded hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-default truncate"
                        >
                          {init.title}
                          {alreadyLinked && <span className="text-neutral-400 ml-1">(linked)</span>}
                        </button>
                      )
                    })}
                  </div>
                ) : linkQuery.trim() ? (
                  <p className="text-[11px] text-neutral-400 px-2 py-1">No matches</p>
                ) : (
                  <p className="text-[11px] text-neutral-400 px-2 py-1">Type to search...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          title="Edit key account"
          className="text-[12px] text-neutral-300 hover:text-neutral-600 px-1 opacity-0 group-hover/strip:opacity-100 transition-opacity shrink-0"
        >
          ✏
        </button>
      </div>

      {/* Edit modal */}
      {isEditing && (
        <KeyAccountModal
          account={account}
          onSave={async (data) => {
            await updateKeyAccount(account.id, data)
            onAccountUpdate({ ...account, ...data })
            setIsEditing(false)
          }}
          onClose={() => setIsEditing(false)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
