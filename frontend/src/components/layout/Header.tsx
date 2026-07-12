import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, User, ChevronDown, Search, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { NotificationBell } from '@/components/approvals/NotificationBell'
import { GlobalSearch } from '@/components/common/GlobalSearch'

function initialsOf(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

interface HeaderProps {
  onChatToggle?: () => void
}

export function Header(_props: HeaderProps) {
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  return (
    <header className="h-16 border-b border-white/5 bg-obsidian-900/70 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        data-testid="global-search-trigger"
        className="inline-flex items-center gap-2.5 rounded-md border border-white/8 bg-obsidian-800/60 px-3.5 py-2 text-[13px] text-slate-400 hover:bg-obsidian-700 hover:border-brass-400/25 hover:text-slate-200 transition-colors min-w-[18rem] group"
        aria-label="Open global search"
      >
        <Search className="h-3.5 w-3.5 text-slate-500 group-hover:text-brass-400 transition-colors" />
        <span className="flex-1 text-left">Search contracts, counterparties…</span>
        <kbd className="rounded border border-white/8 bg-obsidian-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          {isMac ? '⌘/' : 'Ctrl+/'}
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(prev => !prev)}
            data-testid="user-menu-trigger"
            className="flex items-center gap-2.5 text-[13px] text-slate-300 hover:text-white transition-colors rounded-full pl-1 pr-2.5 py-1 hover:bg-obsidian-700/[0.04]"
            aria-label="Account menu"
          >
            <span
              aria-hidden
              className="h-8 w-8 rounded-full bg-gradient-to-br from-brass-400 to-brass-600 text-obsidian-900 flex items-center justify-center text-[11px] font-semibold tracking-wide ring-1 ring-brass-400/40 shadow-glow-brass"
            >
              {initialsOf(user?.name)}
            </span>
            <span className="max-w-[8rem] truncate hidden sm:inline">{user?.name}</span>
            <ChevronDown size={12} className="text-slate-500" />
          </button>

          {showUserMenu && (
            <div
              data-testid="user-menu"
              className="absolute right-0 top-full mt-2 w-64 glass-panel z-30 py-1 overflow-hidden"
              role="menu"
            >
              <div className="px-3 pt-3 pb-3 border-b border-white/5 flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-brass-400 to-brass-600 text-obsidian-900 flex items-center justify-center text-xs font-semibold tracking-wide ring-1 ring-brass-400/40 shrink-0"
                >
                  {initialsOf(user?.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white truncate" data-testid="user-menu-name">
                    {user?.name ?? 'Signed-in user'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate" data-testid="user-menu-email">
                    {user?.email ?? ''}
                  </p>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  data-testid="user-menu-profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-300 hover:text-white hover:bg-obsidian-700/[0.04] transition-colors"
                  role="menuitem"
                >
                  <User size={14} className="text-slate-500" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  data-testid="user-menu-settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-300 hover:text-white hover:bg-obsidian-700/[0.04] transition-colors"
                  role="menuitem"
                >
                  <Settings size={14} className="text-slate-500" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-white/5 py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                    window.location.href = '/login'
                  }}
                  data-testid="user-menu-logout"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-rose-400 hover:bg-rose-500/10 transition-colors"
                  role="menuitem"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
