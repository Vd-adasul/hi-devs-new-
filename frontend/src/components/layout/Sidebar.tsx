import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { Wordmark } from '@/components/brand/Wordmark'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Library,
  BookOpen,
  Shield,
  CheckSquare,
  Building2,
  Settings,
  Users,
  UsersRound,
  ShieldCheck,
  Sparkles,
  Briefcase,
  PenSquare,
  ListTodo,
  CalendarDays,
  Receipt,
  BarChart2,
  FolderOpen,
  Plug,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  Webhook,
} from 'lucide-react'
import { usePermission } from '@/lib/permissions'
import type { LucideIcon } from 'lucide-react'

interface NavSection {
  label?: string
  items: Array<{
    to: string
    icon: LucideIcon
    label: string
    badge?: 'pendingApprovals' | 'openRequests'
    staticBadge?: 'soon'
  }>
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/agent',     icon: Sparkles,        label: 'Assistant' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/matters',        icon: Briefcase,     label: 'Matters' },
      { to: '/contracts',      icon: FileText,      label: 'Contracts' },
      { to: '/requests',       icon: ClipboardList,  label: 'Requests', badge: 'openRequests' },
      { to: '/counterparties', icon: Building2,      label: 'Counterparties' },
    ],
  },
  {
    label: 'Queues',
    items: [
      { to: '/approvals',    icon: CheckSquare, label: 'Approvals', badge: 'pendingApprovals' },
      { to: '/signatures',   icon: PenSquare,   label: 'Signatures' },
    ],
  },
  {
    label: 'Post-signature',
    items: [
      { to: '/obligations',  icon: ListTodo,     label: 'Obligations' },
      { to: '/renewals',     icon: CalendarDays, label: 'Renewals' },
      { to: '/invoices',     icon: Receipt,      label: 'Invoices' },
    ],
  },
  {
    label: 'Library',
    items: [
      { to: '/templates',    icon: Library,  label: 'Templates' },
      { to: '/clauses',      icon: BookOpen, label: 'Clauses' },
      { to: '/playbook',     icon: Shield,   label: 'Playbook' },
      { to: '/research',     icon: Compass,  label: 'Statutory Research' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics',    icon: BarChart2,  label: 'Analytics' },
      { to: '/diligence',    icon: FolderOpen, label: 'Diligence' },
    ],
  },
]

const BADGE_STYLES: Record<string, string> = {
  pendingApprovals: 'bg-brass-400/15 text-brass-300 border border-brass-400/30',
  openRequests:     'bg-obsidian-700/[0.06] text-slate-200 border border-white/10',
}

const ADMIN_SECTION: NavSection = {
  label: 'Admin',
  items: [
    { to: '/admin/users',        icon: Users,       label: 'Users' },
    { to: '/admin/roles',        icon: ShieldCheck, label: 'Roles' },
    { to: '/admin/org',          icon: Building2,   label: 'Organization' },
    { to: '/admin/integrations', icon: Plug,        label: 'Integrations' },
    { to: '/admin/skills',       icon: Sparkles,    label: 'Skills' },
    { to: '/team',               icon: UsersRound,  label: 'Team' },
    { to: '/developer',          icon: Webhook,     label: 'Developers & Webhooks' },
  ],
}

export function Sidebar() {
  const canAdmin = usePermission('configure', 'user')

  const { data: stats } = useQuery<{
    pendingApprovals: number
    openRequests: number
  }>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const badgeCounts: Record<string, number> = {
    pendingApprovals: stats?.pendingApprovals ?? 0,
    openRequests:     stats?.openRequests ?? 0,
  }

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('lawyeros:sidebar-collapsed') === '1'
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setCollapsed(c => {
          const next = !c
          try { localStorage.setItem('lawyeros:sidebar-collapsed', next ? '1' : '0') } catch {/*ignore*/}
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggle = () => {
    setCollapsed(c => {
      const next = !c
      try { localStorage.setItem('lawyeros:sidebar-collapsed', next ? '1' : '0') } catch {/*ignore*/}
      return next
    })
  }

  const showLabel  = collapsed ? 'hidden' : 'hidden lg:inline'
  const showLabelB = collapsed ? 'hidden' : 'hidden lg:block'
  const showLabelF = collapsed ? 'hidden' : 'hidden lg:flex'
  const showLabelI = collapsed ? 'hidden' : 'hidden lg:inline-flex'
  const showMark   = collapsed ? 'inline'  : 'lg:hidden'
  const layoutCls  = collapsed
    ? 'justify-center'
    : 'justify-center lg:justify-start'

  return (
    <aside
      data-testid="app-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      className={cn(
        'border-r border-white/5 bg-obsidian-950 flex flex-col shrink-0 transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-14 lg:w-64',
      )}
    >
      <div className={cn(
        'h-16 flex items-center border-b border-white/5',
        collapsed ? 'justify-center' : 'justify-center lg:justify-start lg:px-5',
      )}>
        <NavLink
          to="/dashboard"
          data-testid="logo-home-link"
          aria-label="LawyerOS — go to dashboard"
          title="LawyerOS — Dashboard"
          className="hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/50 rounded"
        >
          <span className={showMark}><Wordmark size="xl" kind="mark" /></span>
          <span className={showLabel}><Wordmark size="2xl" kind="full" /></span>
        </NavLink>
      </div>

      <nav className={cn('flex-1 py-3 overflow-y-auto', collapsed ? 'px-2' : 'px-2 lg:px-3')}>
        {[...NAV_SECTIONS, ...(canAdmin ? [ADMIN_SECTION] : [])].map((section, i) => (
          <div key={i} className="mb-2">
            {section.label && (
              <p className={cn('px-3 pt-4 pb-2 text-[10px] font-semibold text-brass-400/70 uppercase tracking-[0.2em]', showLabelB)}>
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label, badge, staticBadge }) => {
                const count = badge ? badgeCounts[badge] : 0
                const isComingSoon = staticBadge === 'soon'
                return (
                  <NavLink
                    key={to}
                    to={to}
                    data-testid={isComingSoon
                      ? `nav-${to.replace(/^\//, '').replace(/\//g, '-')}-coming-soon`
                      : `nav-${to.replace(/^\//, '').replace(/\//g, '-')}`}
                    aria-disabled={isComingSoon || undefined}
                    tabIndex={isComingSoon ? -1 : undefined}
                    onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
                    title={label}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 py-2 rounded-md text-[13px] font-medium transition-colors relative',
                        layoutCls,
                        collapsed ? 'px-2' : 'px-2 lg:px-3',
                        isActive
                          ? 'bg-brass-400/12 text-brass-200 shadow-[inset_1px_0_0_0_rgba(212,175,55,0.6)]'
                          : 'text-slate-400 hover:bg-obsidian-700/[0.04] hover:text-white'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} className={cn('shrink-0 transition-colors', isActive ? 'text-brass-300' : 'text-slate-500 group-hover:text-slate-300')} />
                        <span className={cn('flex-1', showLabel)}>{label}</span>
                        {badge && count > 0 && (
                          <span className={cn(
                            'h-5 min-w-5 items-center justify-center rounded-full text-[10.5px] font-semibold px-1.5',
                            showLabelF,
                            BADGE_STYLES[badge],
                          )}>
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                        {badge && count > 0 && (
                          <span
                            aria-hidden
                            className={cn(
                              'absolute top-1 right-1 h-2 w-2 rounded-full',
                              collapsed ? 'inline' : 'lg:hidden',
                              badge === 'pendingApprovals' ? 'bg-brass-400' : 'bg-slate-400',
                            )}
                          />
                        )}
                        {staticBadge === 'soon' && (
                          <span
                            data-testid={`badge-soon-${to.replace(/^\//, '')}`}
                            className={cn('text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brass-400/10 text-brass-300 border border-brass-400/25', showLabelI)}
                          >
                            Soon
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-white/5 space-y-0.5', collapsed ? 'p-2' : 'p-2 lg:p-3')}>
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 py-2 rounded-md text-[13px] font-medium transition-colors',
              layoutCls,
              collapsed ? 'px-2' : 'px-2 lg:px-3',
              isActive
                ? 'bg-brass-400/12 text-brass-200'
                : 'text-slate-400 hover:bg-obsidian-700/[0.04] hover:text-white'
            )
          }
        >
          <Settings size={16} className="shrink-0" />
          <span className={showLabel}>Settings</span>
        </NavLink>
        <button
          type="button"
          onClick={toggle}
          data-testid="sidebar-collapse-toggle"
          aria-label={collapsed ? 'Expand sidebar (⌘\\)' : 'Collapse sidebar (⌘\\)'}
          title={collapsed ? 'Expand sidebar (⌘\\)' : 'Collapse sidebar (⌘\\)'}
          className={cn(
            'hidden lg:flex w-full items-center gap-3 py-2 rounded-md text-[11.5px] font-medium text-slate-500 hover:bg-obsidian-700/[0.04] hover:text-white transition-colors',
            layoutCls,
            collapsed ? 'px-2' : 'px-2 lg:px-3',
          )}
        >
          {collapsed
            ? <PanelLeftOpen size={16} className="shrink-0" />
            : <PanelLeftClose size={16} className="shrink-0" />}
          <span className={showLabel}>Collapse</span>
          <span className={cn('ml-auto text-[10px] font-mono text-slate-500', showLabel)}>⌘\</span>
        </button>
      </div>
    </aside>
  )
}
