'use client'

import { useState } from 'react'
import type { Locale } from '@/app/[lang]/dictionaries'
import { useRouter } from 'next/navigation'
import { Save, Loader2, BookOpen, Clock, Target } from 'lucide-react'

export function SettingsForm({
  dict,
  lang,
  profile
}: {
  dict: any
  lang: Locale
  profile: any
}) {
  const t = dict.settings
  const levels = dict.onboarding.levels
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    daily_minutes: profile.daily_minutes || 30,
    study_intensity: profile.study_intensity || 'medium',
    target_level: profile.target_level || 'sfi_d'
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate estimated completion time
  const levelIndex: Record<string, number> = { 'sfi_c': 0, 'sfi_d': 1, 'sas_grund': 2, 'sas_1': 3, 'sas_2': 4, 'sas_3': 5 }
  const intensityMult: Record<string, number> = { 'low': 1.5, 'medium': 1.0, 'high': 0.8, 'extreme': 0.6 }
  
  const currentIdx = levelIndex[profile.current_level || 'sfi_c'] || 0
  const targetIdx = levelIndex[formData.target_level] || 0
  
  let estimateText = ''
  if (targetIdx <= currentIdx) {
    estimateText = lang === 'zh' ? '目标在当前水平之下或平级，只需巩固练习。' : 'Target is at or below current level. Just practice to maintain!'
  } else {
    const distance = targetIdx - currentIdx
    // Standard 100 hours (6000 mins) per level
    const totalMinsNeeded = distance * 6000 * intensityMult[formData.study_intensity]
    const daysNeeded = totalMinsNeeded / formData.daily_minutes
    const months = Math.round(daysNeeded / 30)
    
    if (months < 1) {
      estimateText = lang === 'zh' ? '不到 1 个月即可达成目标！🚀' : 'Less than 1 month to reach your goal! 🚀'
    } else if (months > 12) {
      const years = Math.floor(months / 12)
      const remainMonths = months % 12
      estimateText = lang === 'zh' 
        ? `预估需要 ${years}年 ${remainMonths > 0 ? remainMonths + '个月' : ''} 达成目标 📅`
        : `Estimate: ${years} year${years > 1 ? 's' : ''} ${remainMonths > 0 ? remainMonths + ' month(s)' : ''} to reach goal 📅`
    } else {
      estimateText = lang === 'zh' ? `预估需要约 ${months} 个月达成目标 📅` : `Estimate: ~${months} months to reach goal 📅`
    }
  }

  return (
    <div className="settings-page">
      <div className="header">
        <h1>{t.title}</h1>
      </div>
      <form className="settings-form" onSubmit={handleSubmit}>
      
      <div className="settings-section">
        <div className="section-header">
          <div className="sh-icon"><BookOpen size={20} /></div>
          <div className="sh-text">
            <h3>{t.studyIntensity}</h3>
            <p>{t.studyIntensityDesc}</p>
          </div>
        </div>
        <div className="options-grid intensities">
          {['low', 'medium', 'high', 'extreme'].map(level => (
            <div 
              key={level} 
              className={`option-card ${formData.study_intensity === level ? 'active' : ''}`}
              onClick={() => handleChange('study_intensity', level)}
            >
              <div className="chk">
                <div className="chk-inner" />
              </div>
              <div className="opt-content">
                <strong>{t.intensities[level].label}</strong>
                <span>{t.intensities[level].desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <div className="sh-icon"><Clock size={20} /></div>
          <div className="sh-text">
            <h3>{t.dailyTime}</h3>
            <p>{t.dailyTimeDesc}</p>
          </div>
        </div>
        <div className="options-grid">
          {[15, 30, 60, 120].map(mins => (
            <div 
              key={mins} 
              className={`option-card ${formData.daily_minutes === mins ? 'active' : ''}`}
              onClick={() => handleChange('daily_minutes', mins)}
            >
              <div className="chk">
                <div className="chk-inner" />
              </div>
              <div className="opt-content">
                <strong>{mins} {dict.onboarding.minutes}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <div className="sh-icon"><Target size={20} /></div>
          <div className="sh-text">
            <h3>{t.targetLevel}</h3>
            <p>{t.targetLevelDesc}</p>
          </div>
        </div>
        <div className="options-grid">
          {Object.entries(levels).map(([key, info]: [string, any]) => (
            <div 
              key={key} 
              className={`option-card ${formData.target_level === key ? 'active' : ''}`}
              onClick={() => handleChange('target_level', key)}
            >
              <div className="chk">
                <div className="chk-inner" />
              </div>
              <div className="opt-content">
                <strong>{info.label}</strong>
                <span>{info.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="estimate-block">
        {estimateText}
      </div>

      <div className="form-actions">
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{t.savedSuccess}</div>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
          {t.saveChanges}
        </button>
      </div>

      <style /* eslint-disable react/no-unknown-property */ jsx>{`
        .settings-page {
          padding-bottom: 4rem;
        }
        .header {
          margin-bottom: 2rem;
        }
        .header h1 {
          font-size: 2rem;
          font-weight: 800;
        }
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          max-width: 800px;
        }
        .settings-section {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }
        .section-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .sh-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sh-text h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .sh-text p {
          color: var(--muted-foreground);
          font-size: 0.875rem;
        }
        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .options-grid.intensities {
          grid-template-columns: 1fr 1fr;
        }
        .option-card {
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          background: var(--background);
        }
        .option-card:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }
        .option-card.active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }
        .chk {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }
        .option-card.active .chk {
          border-color: #3b82f6;
        }
        .option-card.active .chk-inner {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #3b82f6;
        }
        .opt-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .opt-content strong {
          font-size: 0.9375rem;
          color: var(--foreground);
        }
        .opt-content span {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
        }
        .estimate-block {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          text-align: center;
          margin-top: -1rem;
        }
        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .btn-primary {
          min-width: 150px;
        }
        .success-msg {
          color: #10b981;
          font-weight: 500;
          font-size: 0.875rem;
        }
        .error-msg {
          color: #ef4444;
          font-weight: 500;
          font-size: 0.875rem;
        }
        @media (max-width: 640px) {
          .options-grid.intensities {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
    </div>
  )
}
