import { useState } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'

type StubKind = 'sso-google' | 'sso-microsoft' | 'sso-saml'

const STUB_COPY: Record<StubKind, { title: string; body: string; eta: string }> = {
  'sso-google': {
    title: 'Sign in with Google',
    body: 'Your admin can link your workspace to Google Workspace for one-click sign-in. Tell them to enable it in Organization → Single Sign-On.',
    eta: 'Available in v1.1',
  },
  'sso-microsoft': {
    title: 'Sign in with Microsoft',
    body: 'Your admin can link your workspace to Microsoft Entra ID (formerly Azure AD) for one-click sign-in. Tell them to enable it in Organization → Single Sign-On.',
    eta: 'Available in v1.1',
  },
  'sso-saml': {
    title: 'Enterprise SSO (SAML / OIDC)',
    body: 'For companies using Okta, OneLogin, JumpCloud or any SAML 2.0 / OIDC identity provider. Your admin configures the IdP connection once; users sign in with their corporate identity forever after.',
    eta: 'Available in v1.1',
  },
}

function StubDialog({ kind, onClose }: { kind: StubKind; onClose: () => void }) {
  const { title, body, eta } = STUB_COPY[kind]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div
        className="glass-panel-brass w-full max-w-md mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="headline text-xl text-white">{title}</h2>
          <span className="shrink-0 rounded-full bg-brass-400/15 border border-brass-400/30 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-widest text-brass-300">
            {eta}
          </span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed font-light">{body}</p>
        <div className="flex items-center gap-2 rounded-md bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-slate-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-brass-400 shrink-0" />
          Sign in with email &amp; password below to continue for now.
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-brass text-[13px]">Got it</button>
        </div>
      </div>
    </div>
  )
}

function ForgotPasswordDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    setErrorMsg('')
    setPending(true)
    try {
      await api.post('/auth/request-password-reset', { email: email.trim() })
      setDone(true)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 400) {
        setErrorMsg('Please enter a valid email address.')
      } else {
        setErrorMsg("Couldn't send the request. Please try again or contact your admin directly.")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div
        className="glass-panel-brass w-full max-w-md mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        data-testid="forgot-password-dialog"
      >
        {done ? (
          <>
            <div className="flex items-center gap-2">
              <MailCheck className="h-5 w-5 text-brass-400" />
              <h2 className="headline text-xl text-white">Request sent</h2>
            </div>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              If an account exists for <span className="text-white font-medium">{email}</span>,
              your administrator has been notified. They&apos;ll send you a new temporary password — usually within a few hours.
            </p>
            <div className="rounded-md bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-slate-500 leading-relaxed">
              Tip: still no email after a day? Reach out to your admin directly.
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn-brass text-[13px]" data-testid="forgot-password-close">
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="headline text-xl text-white">Reset your password</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-light">
                Enter your work email and we&apos;ll notify your admin to send a new temporary password.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-slate-300">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  data-testid="forgot-password-email"
                  autoFocus
                  className="bg-obsidian-900 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-brass-400/40"
                />
              </div>
              {errorMsg && <p className="text-xs text-rose-400" data-testid="forgot-password-error">{errorMsg}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} disabled={pending} className="text-sm text-slate-400 hover:text-white px-3 py-2 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={pending || !email} className="btn-brass text-[13px] disabled:opacity-60 disabled:cursor-not-allowed" data-testid="forgot-password-submit">
                  {pending ? (
                    <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</span>
                  ) : (
                    'Notify my admin'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
function MicrosoftMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 23 23" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#7FBA00" d="M12 1h10v10H12z"/>
      <path fill="#00A4EF" d="M1 12h10v10H1z"/>
      <path fill="#FFB900" d="M12 12h10v10H12z"/>
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stub, setStub] = useState<StubKind | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)

  if (isAuthenticated) {
    const rawNext = searchParams.get('next')
    const dest = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'
    return <Navigate to={dest} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const rawNext = searchParams.get('next')
      const safeNext =
        rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
          ? rawNext
          : '/dashboard'
      navigate(safeNext)
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-obsidian-900 text-white overflow-hidden relative">
      {/* Background architecture image (left) */}
      <div
        aria-hidden
        className="hidden lg:block absolute inset-y-0 left-0 w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1712567604499-08f207054260?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBidWlsZGluZyUyMGdsYXNzJTIwZGFya3xlbnwwfHx8fDE3ODM4MTIzNzR8MA&ixlib=rb-4.1.0&q=85')" }}
      />
      <div aria-hidden className="hidden lg:block absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-obsidian-900/85 via-obsidian-900/70 to-obsidian-900" />
      <div aria-hidden className="absolute inset-0 hero-aurora opacity-70" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left column — editorial marquee */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
          <Link to="/" data-testid="auth-brand" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm">Back to home</span>
          </Link>

          <div>
            <p className="eyebrow">The AI workspace for modern legal</p>
            <h1 className="headline mt-6 text-5xl xl:text-6xl text-white leading-[0.98]">
              Welcome back to<br />
              <span className="headline-italic text-brass-gradient">LawyerOS.</span>
            </h1>
            <p className="mt-6 text-slate-400 text-lg font-light max-w-md leading-relaxed">
              Where the precision of Big Law meets the speed of AI. Your workspace is exactly where you left it.
            </p>
          </div>

          <div className="text-[11px] text-slate-500 font-mono tracking-wider">
            © {new Date().getFullYear()} LAWYEROS · EST MMXXVI
          </div>
        </div>

        {/* Right column — auth card */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link to="/" className="lg:hidden inline-flex justify-center w-full mb-8">
              <Wordmark size="2xl" />
            </Link>

            <div className="glass-panel p-8 md:p-10">
              <div className="text-center">
                <div className="inline-flex mx-auto">
                  <Wordmark size="2xl" />
                </div>
                <h2 className="headline mt-6 text-3xl text-white">Sign in</h2>
                <p className="mt-2 text-sm text-slate-400 font-light">Welcome back — please enter your details.</p>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  type="button"
                  onClick={() => setStub('sso-google')}
                  data-testid="sso-google"
                  className="w-full inline-flex items-center justify-center gap-2.5 h-11 rounded-md border border-white/10 bg-white/[0.03] text-sm font-medium text-white hover:bg-obsidian-700/[0.06] hover:border-brass-400/30 transition-colors"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => setStub('sso-microsoft')}
                  data-testid="sso-microsoft"
                  className="w-full inline-flex items-center justify-center gap-2.5 h-11 rounded-md border border-white/10 bg-white/[0.03] text-sm font-medium text-white hover:bg-obsidian-700/[0.06] hover:border-brass-400/30 transition-colors"
                >
                  <MicrosoftMark />
                  Continue with Microsoft
                </button>
                <button
                  type="button"
                  onClick={() => setStub('sso-saml')}
                  data-testid="sso-saml"
                  className="w-full h-10 text-xs font-medium text-slate-400 hover:text-brass-300 transition-colors"
                >
                  Use enterprise SSO (SAML / OIDC)
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/8" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-obsidian-700 px-3 text-[10.5px] uppercase tracking-widest text-slate-500 font-mono">or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-300 text-[13px]">Email</Label>
                  <Input
                    id="email"
                    data-testid="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11 bg-obsidian-900 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-brass-400/40 focus-visible:border-brass-400/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300 text-[13px]">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      data-testid="forgot-password-link"
                      className="text-xs text-brass-400 hover:text-brass-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    data-testid="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-obsidian-900 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-brass-400/40 focus-visible:border-brass-400/60"
                  />
                </div>

                {error && (
                  <p className="text-sm text-rose-400" data-testid="login-error">{error}</p>
                )}

                <button
                  type="submit"
                  data-testid="login-submit"
                  className="btn-brass w-full h-11 justify-center text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</span>
                  ) : (
                    <>Sign in <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-8 text-sm text-center text-slate-400">
                No account?{' '}
                <Link to="/register" className="text-brass-400 hover:text-brass-300 transition-colors font-medium">
                  Create one
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center text-[11px] text-slate-500 space-x-3">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
              <span>·</span>
              <Link to="/status" className="hover:text-slate-300 transition-colors">Status</Link>
            </div>
          </div>
        </div>
      </div>

      {stub && <StubDialog kind={stub} onClose={() => setStub(null)} />}
      {forgotOpen && <ForgotPasswordDialog onClose={() => setForgotOpen(false)} />}
    </div>
  )
}
