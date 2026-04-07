'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/app/[lang]/dictionaries'

interface AuthFormProps {
  mode: 'login' | 'signup'
  dict: Record<string, any>
  lang: Locale
}

export function AuthForm({ mode, dict, lang }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const t = dict.auth

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(`/${lang}/dashboard`)
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/${lang}/onboarding`,
          },
        })
        if (error) throw error
        router.push(`/${lang}/onboarding`)
      }
    } catch (err: any) {
      setError(err.message || dict.common.error)
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left panel - branding */}
        <div className="auth-brand">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <BookOpen size={32} />
            </div>
            <h2 className="auth-brand-title">SFI Tutor</h2>
            <p className="auth-brand-text">
              {isLogin
                ? 'From SFI C to SAS 3 — your AI-powered path to Swedish fluency.'
                : 'Join thousands learning Swedish with personalized AI tutoring.'}
            </p>
            <div className="auth-brand-levels">
              {['SFI C', 'SFI D', 'SAS Grund', 'SAS 1', 'SAS 2', 'SAS 3'].map((level) => (
                <span key={level} className="auth-brand-level">{level}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h1 className="auth-form-title">
                {isLogin ? t.loginTitle : t.signupTitle}
              </h1>
              <p className="auth-form-subtitle">
                {isLogin ? t.loginSubtitle : t.signupSubtitle}
              </p>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">{t.email}</label>
                <div className="auth-input-wrap">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password" className="auth-label">{t.password}</label>
                <div className="auth-input-wrap">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="auth-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary auth-submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    {isLogin ? t.signingIn : t.signingUp}
                  </>
                ) : (
                  <>
                    {isLogin ? t.login : t.signup}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-switch">
              {isLogin ? t.noAccount : t.hasAccount}{' '}
              <Link href={`/${lang}/${isLogin ? 'signup' : 'login'}`} className="auth-switch-link">
                {isLogin ? dict.nav.signup : t.login}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          padding-top: 80px;
        }
        .auth-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 960px;
          width: 100%;
          border-radius: var(--radius-2xl);
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--card);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
        }
        .auth-brand {
          background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800));
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .auth-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 60%);
        }
        .auth-brand-content {
          position: relative;
          text-align: center;
        }
        .auth-brand-logo {
          width: 64px;
          height: 64px;
          background: rgba(255,255,255,0.15);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .auth-brand-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
        }
        .auth-brand-text {
          font-size: 0.9375rem;
          opacity: 0.85;
          line-height: 1.6;
          max-width: 300px;
          margin: 0 auto 1.5rem;
        }
        .auth-brand-levels {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }
        .auth-brand-level {
          padding: 0.25rem 0.75rem;
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .auth-form-panel {
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-form-wrapper {
          width: 100%;
          max-width: 380px;
        }
        .auth-form-header {
          margin-bottom: 2rem;
        }
        .auth-form-title {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .auth-form-subtitle {
          font-size: 0.9375rem;
          color: var(--muted-foreground);
          margin-top: 0.375rem;
        }
        .auth-error {
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .auth-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .auth-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-input-icon {
          position: absolute;
          left: 0.875rem;
          color: var(--muted-foreground);
          pointer-events: none;
        }
        .auth-input {
          width: 100%;
          padding: 0.75rem 0.875rem 0.75rem 2.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          background: var(--background);
          color: var(--foreground);
          transition: border-color 0.15s ease;
          outline: none;
        }
        .auth-input:focus {
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px rgba(51, 153, 255, 0.1);
        }
        .auth-submit {
          width: 100%;
          margin-top: 0.5rem;
        }
        .spin {
          animation: spinner 1s linear infinite;
        }
        @keyframes spinner {
          to { transform: rotate(360deg); }
        }
        .auth-switch {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: var(--muted-foreground);
        }
        .auth-switch-link {
          color: var(--color-primary-500);
          font-weight: 600;
          text-decoration: none;
        }
        .auth-switch-link:hover {
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          .auth-container {
            grid-template-columns: 1fr;
          }
          .auth-brand {
            display: none;
          }
          .auth-form-panel {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
