/**
 * RegisterPage — editorial-luxe redesign. Preserves the enterprise-hygiene
 * affordances (strength bar, confirm field, terms checkbox) and testids.
 */
import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'

interface Strength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  reasons: string[]
}

function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, label: '', reasons: [] }
  let points = 0
  const reasons: string[] = []
  if (pw.length >= 8) points += 1
  else reasons.push('at least 8 characters')
  if (pw.length >= 12) points += 1
  else if (pw.length >= 8) reasons.push('12+ characters for stronger')
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) points += 1
  else reasons.push('mixed upper + lower case')
  if (/\d/.test(pw)) points += 1
  else reasons.push('a number')
  if (/[^A-Za-z0-9]/.test(pw)) points += 1
  else reasons.push('a symbol')
  const score = Math.min(4, Math.max(1, Math.floor(points * 0.8))) as 1 | 2 | 3 | 4
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  return { score, label, reasons }
}

const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-amber-400', 'bg-emerald-400', 'bg-brass-400']
const STRENGTH_TEXT = ['', 'text-rose-400', 'text-amber-300', 'text-emerald-400', 'text-brass-300']

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [form, setForm] = useState({
    orgName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => scorePassword(form.password), [form.password])
  const passwordsMatch =
    form.password.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword
  const confirmMismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password

  const canSubmit =
    !!form.orgName.trim() &&
    !!form.name.trim() &&
    !!form.email.trim() &&
    strength.score >= 2 &&
    passwordsMatch &&
    termsAccepted &&
    !loading

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      await register({
        orgName: form.orgName,
        name: form.name,
        email: form.email,
        password: form.password,
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'h-11 bg-obsidian-900 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-brass-400/40 focus-visible:border-brass-400/60'

  return (
    <div className="min-h-screen w-full bg-obsidian-900 text-white overflow-hidden relative">
      <div
        aria-hidden
        className="hidden lg:block absolute inset-y-0 right-0 w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526289034009-0240ddb68ce3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBidWlsZGluZyUyMGdsYXNzJTIwZGFya3xlbnwwfHx8fDE3ODM4MTIzNzR8MA&ixlib=rb-4.1.0&q=85')" }}
      />
      <div aria-hidden className="hidden lg:block absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-obsidian-900/85 via-obsidian-900/70 to-obsidian-900" />
      <div aria-hidden className="absolute inset-0 hero-aurora opacity-70" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left column — form */}
        <div className="flex items-center justify-center p-6 sm:p-10 py-16">
          <div className="w-full max-w-md">
            <Link to="/" className="lg:hidden inline-flex justify-center w-full mb-8">
              <Wordmark size="2xl" />
            </Link>

            <div className="glass-panel p-8 md:p-10">
              <div>
                <div className="inline-flex">
                  <Wordmark size="2xl" />
                </div>
                <h2 className="headline mt-6 text-3xl text-white">Create your workspace</h2>
                <p className="mt-2 text-sm text-slate-400 font-light">Set up your legal operating system in under a minute.</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4" data-testid="register-form">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName" className="text-slate-300 text-[13px]">Company name</Label>
                  <Input id="orgName" name="orgName" type="text" required autoComplete="organization" value={form.orgName} onChange={handleChange} placeholder="Acme Corp" className={inputCls} data-testid="register-org" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-300 text-[13px]">Your name</Label>
                  <Input id="name" name="name" type="text" required autoComplete="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" className={inputCls} data-testid="register-name" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-300 text-[13px]">Work email</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" value={form.email} onChange={handleChange} placeholder="jane@acme.com" className={inputCls} data-testid="register-email" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-300 text-[13px]">Password</Label>
                  <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="••••••••" aria-describedby="password-strength" className={inputCls} data-testid="register-password" />
                  {form.password.length > 0 && (
                    <div id="password-strength" className="pt-1 space-y-1.5" data-testid="password-strength">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= strength.score ? STRENGTH_COLORS[strength.score] : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-medium tabular-nums ${STRENGTH_TEXT[strength.score]}`}>
                          {strength.label}
                        </span>
                      </div>
                      {strength.score < 3 && strength.reasons.length > 0 && (
                        <p className="text-[11px] text-slate-500">
                          Add: {strength.reasons.slice(0, 3).join(' · ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-[13px]">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    data-testid="confirm-password"
                    aria-invalid={confirmMismatch}
                    aria-describedby={confirmMismatch ? 'confirm-mismatch' : undefined}
                    className={`${inputCls} ${confirmMismatch ? 'border-rose-500/60 focus-visible:ring-rose-500/40' : ''}`}
                  />
                  {confirmMismatch ? (
                    <p id="confirm-mismatch" className="flex items-center gap-1 text-xs text-rose-400">
                      <AlertCircle className="h-3 w-3" />
                      Passwords don&rsquo;t match
                    </p>
                  ) : passwordsMatch ? (
                    <p className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Passwords match
                    </p>
                  ) : null}
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    data-testid="terms-checkbox"
                    className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-obsidian-900 text-brass-400 focus:ring-brass-400/40"
                    required
                  />
                  <span className="leading-snug">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brass-400 hover:text-brass-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brass-400 hover:text-brass-300">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                {error && <p className="text-sm text-rose-400" data-testid="register-error">{error}</p>}

                <button
                  type="submit"
                  className="btn-brass w-full h-11 justify-center text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canSubmit}
                  data-testid="register-submit"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating…</span>
                  ) : (
                    <>Create account <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-6 text-sm text-center text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-brass-400 hover:text-brass-300 transition-colors font-medium">
                  Sign in
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

        {/* Right column — editorial marquee */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
          <div className="flex justify-end">
            <Link to="/" data-testid="back-home" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm">Back to home</span>
            </Link>
          </div>

          <div className="text-right">
            <p className="eyebrow justify-end">Trusted by modern legal teams</p>
            <h1 className="headline mt-6 text-5xl xl:text-6xl text-white leading-[0.98]">
              Set up your<br />
              <span className="headline-italic text-brass-gradient">workspace.</span>
            </h1>
            <p className="mt-6 text-slate-400 text-lg font-light max-w-md ml-auto leading-relaxed">
              A single, deliberate surface for contracts, matters, research, and the AI that ties it all together.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              {['30-day free trial on Firm tier', 'SOC 2 · SSO · immutable audit', 'Live in under 15 minutes'].map(item => (
                <li key={item} className="flex items-center justify-end gap-2.5">
                  <span>{item}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brass-400" />
                </li>
              ))}
            </ul>
          </div>

          <div className="text-right text-[11px] text-slate-500 font-mono tracking-wider">
            © {new Date().getFullYear()} LAWYEROS · EST MMXXVI
          </div>
        </div>
      </div>
    </div>
  )
}
