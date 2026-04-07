'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Sparkles, BookOpen, Target, Clock, Globe, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/app/[lang]/dictionaries'

const LEVELS = ['sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3'] as const
const TIME_OPTIONS = [15, 30, 60, 120] as const
const LEVEL_COLORS: Record<string, string> = {
  sfi_c: '#22c55e', sfi_d: '#3b82f6', sas_grund: '#8b5cf6',
  sas_1: '#f59e0b', sas_2: '#ef4444', sas_3: '#ec4899',
}

interface Props { dict: Record<string, any>; lang: Locale }

export function OnboardingWizard({ dict, lang }: Props) {
  const [step, setStep] = useState(0)
  const [currentLevel, setCurrentLevel] = useState('')
  const [targetLevel, setTargetLevel] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState(30)
  const [locale, setLocale] = useState<Locale>(lang)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const t = dict.onboarding

  const steps = [
    { icon: BookOpen, title: t.currentLevel },
    { icon: Target, title: t.targetLevel },
    { icon: Clock, title: t.dailyTime },
    { icon: Globe, title: t.language },
  ]

  const canNext = () => {
    if (step === 0) return !!currentLevel
    if (step === 1) return !!targetLevel
    return true
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${lang}/login`); return }

      await supabase.from('profiles').update({
        current_level: currentLevel,
        target_level: targetLevel,
        daily_minutes: dailyMinutes,
        locale,
      }).eq('id', user.id)

      // Trigger AI study plan generation in background
      fetch('/api/plan/generate', { method: 'POST' }).catch(() => {})

      router.push(`/${locale}/dashboard`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        {/* Progress bar */}
        <div className="onboarding-progress">
          {steps.map((_, i) => (
            <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-step-indicator">
          {t.step} {step + 1} {t.of} {steps.length}
        </div>

        {/* Welcome header on first step */}
        {step === 0 && (
          <div className="onboarding-welcome">
            <Sparkles size={24} className="onboarding-welcome-icon" />
            <h1>{t.welcome}</h1>
            <p>{t.welcomeDesc}</p>
          </div>
        )}

        <h2 className="onboarding-question">{steps[step].title}</h2>

        {/* Step 0: Current level */}
        {step === 0 && (
          <div className="onboarding-options">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                className={`option-card ${currentLevel === lvl ? 'selected' : ''}`}
                onClick={() => setCurrentLevel(lvl)}
                style={{ '--accent': LEVEL_COLORS[lvl] } as React.CSSProperties}
              >
                <div className="option-dot" />
                <div>
                  <div className="option-label">{t.levels[lvl].label}</div>
                  <div className="option-desc">{t.levels[lvl].desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Target level */}
        {step === 1 && (
          <div className="onboarding-options">
            {LEVELS.filter((l) => LEVELS.indexOf(l) > LEVELS.indexOf(currentLevel as any)).map((lvl) => (
              <button
                key={lvl}
                className={`option-card ${targetLevel === lvl ? 'selected' : ''}`}
                onClick={() => setTargetLevel(lvl)}
                style={{ '--accent': LEVEL_COLORS[lvl] } as React.CSSProperties}
              >
                <div className="option-dot" />
                <div>
                  <div className="option-label">{t.levels[lvl].label}</div>
                  <div className="option-desc">{t.levels[lvl].desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Daily time */}
        {step === 2 && (
          <div className="onboarding-options">
            {TIME_OPTIONS.map((mins) => (
              <button
                key={mins}
                className={`option-card ${dailyMinutes === mins ? 'selected' : ''}`}
                onClick={() => setDailyMinutes(mins)}
                style={{ '--accent': 'var(--color-primary-500)' } as React.CSSProperties}
              >
                <div className="option-dot" />
                <div className="option-label">{t.timeOptions[String(mins)]}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Language */}
        {step === 3 && (
          <div className="onboarding-options">
            {[
              { id: 'en' as Locale, label: 'English', flag: '🇬🇧' },
              { id: 'zh' as Locale, label: '中文', flag: '🇨🇳' },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`option-card ${locale === opt.id ? 'selected' : ''}`}
                onClick={() => setLocale(opt.id)}
                style={{ '--accent': 'var(--color-primary-500)' } as React.CSSProperties}
              >
                <span className="option-flag">{opt.flag}</span>
                <div className="option-label">{opt.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="onboarding-nav">
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={18} />
              {dict.common.back}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < steps.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
            >
              {dict.common.next}
              <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleFinish} disabled={saving}>
              {saving ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
              {t.letsGo}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .onboarding-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          padding-top: 80px;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(51, 153, 255, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 60%);
        }
        .onboarding-card {
          max-width: 560px;
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.06);
        }
        .onboarding-progress {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 0.75rem;
        }
        .progress-dot {
          width: 40px;
          height: 4px;
          border-radius: 999px;
          background: var(--border);
          transition: background 0.3s ease;
        }
        .progress-dot.active {
          background: var(--color-primary-500);
        }
        .onboarding-step-indicator {
          text-align: center;
          font-size: 0.8125rem;
          color: var(--muted-foreground);
          margin-bottom: 1.5rem;
        }
        .onboarding-welcome {
          text-align: center;
          margin-bottom: 2rem;
        }
        .onboarding-welcome-icon {
          color: var(--color-primary-500);
          margin-bottom: 0.75rem;
        }
        .onboarding-welcome h1 {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .onboarding-welcome p {
          color: var(--muted-foreground);
          font-size: 0.9375rem;
          margin-top: 0.5rem;
        }
        .onboarding-question {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
        }
        .onboarding-options {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .option-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem 1.25rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--background);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }
        .option-card:hover {
          border-color: var(--accent, var(--color-primary-500));
          background: color-mix(in srgb, var(--accent, var(--color-primary-500)) 5%, transparent);
        }
        .option-card.selected {
          border-color: var(--accent, var(--color-primary-500));
          background: color-mix(in srgb, var(--accent, var(--color-primary-500)) 8%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, var(--color-primary-500)) 15%, transparent);
        }
        .option-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--accent, var(--color-primary-500));
          flex-shrink: 0;
          opacity: 0.6;
        }
        .option-card.selected .option-dot {
          opacity: 1;
          box-shadow: 0 0 8px var(--accent, var(--color-primary-500));
        }
        .option-label {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .option-desc {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
          margin-top: 0.125rem;
        }
        .option-flag {
          font-size: 1.5rem;
        }
        .onboarding-nav {
          display: flex;
          align-items: center;
          margin-top: 2rem;
          gap: 0.75rem;
        }
        .spin {
          animation: spinner 1s linear infinite;
        }
        @keyframes spinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
