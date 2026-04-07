'use client'

import { useState, useEffect } from 'react'
import {
  Upload, Brain, PenTool, BarChart3, Flame, BookOpen, Target,
  Sparkles, Loader2, Check, Clock, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import type { Locale } from '@/app/[lang]/dictionaries'

interface Props {
  dict: Record<string, any>
  lang: Locale
  profile: any
}

export function DashboardHome({ dict, lang, profile }: Props) {
  const t = dict.dashboard
  const [generating, setGenerating] = useState(false)
  const [lesson, setLesson] = useState<any>(null)
  const [lessonMeta, setLessonMeta] = useState<any>(null)
  const [lessonError, setLessonError] = useState('')

  const levelLabel = profile?.current_level?.replace('_', ' ').toUpperCase() || '—'
  const targetLabel = profile?.target_level?.replace('_', ' ').toUpperCase() || '—'
  const streak = profile?.study_streak || 0
  const dailyMinutes = profile?.daily_minutes || 30

  useEffect(() => {
    // Check if there's already a lesson generated for today
    fetch('/api/lesson/today')
      .then(res => res.json())
      .then(data => {
        if (data.lesson) {
          setLesson(data.lesson)
          if (data.meta) setLessonMeta(data.meta)
        }
      })
      .catch(err => console.error('Failed to load today lesson:', err))
  }, [])

  const generateLesson = async (force: boolean = false) => {
    setGenerating(true)
    setLessonError('')
    if (force) setLesson(null)
    try {
      const url = force ? '/api/lesson/generate?force=true' : '/api/lesson/generate'
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate lesson')
      }
      setLesson(data.lesson)
      // Store metadata for display
      if (data.unit) setLessonMeta({
        unit: data.unit,
        lessonsCompleted: data.lessonsCompleted || 0,
        completedUnits: data.completedUnits || 0,
        focusAreas: data.focusAreas || [],
      })
    } catch (err: any) {
      console.error('Generation error:', err)
      setLessonError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const quickActions = [
    { key: 'uploadMaterials', icon: Upload, href: `/${lang}/dashboard/materials`, color: '#3b82f6' },
    { key: 'reviewFlashcards', icon: Brain, href: `/${lang}/dashboard/flashcards`, color: '#8b5cf6' },
    { key: 'startPractice', icon: PenTool, href: `/${lang}/dashboard/practice`, color: '#f59e0b' },
    { key: 'viewProgress', icon: BarChart3, href: `/${lang}/dashboard/progress`, color: '#22c55e' },
  ]

  return (
    <div className="dash-home">
      {/* Welcome header */}
      <div className="dash-welcome">
        <h1>{t.welcome} 👋</h1>
        <p>{dailyMinutes} min/day • {levelLabel} → {targetLabel}</p>
      </div>

      {/* Stats cards */}
      <div className="dash-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <Flame size={22} />
          </div>
          <div>
            <div className="stat-value">{streak}</div>
            <div className="stat-label">{t.streak}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className="stat-value">{levelLabel}</div>
            <div className="stat-label">{t.level}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Target size={22} />
          </div>
          <div>
            <div className="stat-value">{targetLabel}</div>
            <div className="stat-label">{t.target}</div>
          </div>
        </div>
      </div>

      {/* Today's plan */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">{t.todayPlan}</h2>
          {!lesson && !generating && (
            <button className="btn btn-primary" onClick={() => generateLesson(false)}>
              <Sparkles size={16} />
              {lang === 'zh' ? '生成今日课程' : 'Generate Today\'s Lesson'}
            </button>
          )}
          {lesson && !generating && (
            <button className="btn btn-secondary" onClick={() => generateLesson(true)} style={{ marginLeft: 'auto' }}>
              <Sparkles size={16} />
              {lang === 'zh' ? '重新生成课程' : 'Regenerate Lesson'}
            </button>
          )}
        </div>

        {generating && (
          <div className="dash-generating">
            <Loader2 size={32} className="spin" />
            <p>{lang === 'zh' ? 'AI 正在为你准备今日学习内容...' : 'AI is preparing your lesson...'}</p>
          </div>
        )}

        {lessonError && !lesson && (
          <div className="dash-info-msg">
            <p>{lessonError}</p>
          </div>
        )}

        {lesson && (
          <div className="lesson-cards">
            {/* Unit progress indicator */}
            {lessonMeta && (
              <div className="unit-progress-bar">
                <div className="unit-progress-info">
                  <span className="unit-progress-label">
                    📚 {lessonMeta.unit}
                  </span>
                  <span className="unit-progress-count">
                    {lang === 'zh'
                      ? `第 ${lessonMeta.lessonsCompleted + 1} 节课 · 已完成 ${lessonMeta.completedUnits} 个单元`
                      : `Lesson ${lessonMeta.lessonsCompleted + 1} · ${lessonMeta.completedUnits} units done`
                    }
                  </span>
                </div>
                <div className="unit-progress-track">
                  <div
                    className="unit-progress-fill"
                    style={{ width: `${Math.min(100, ((lessonMeta.lessonsCompleted + 1) / 5) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {lesson.tasks?.map((task: any, i: number) => (
              <div key={i} className="lesson-card">
                <div className="lesson-card-header">
                  <span className={`lesson-type-badge ${task.type}`}>
                    {task.type === 'vocabulary' && '📝'}
                    {task.type === 'grammar' && '📐'}
                    {task.type === 'reading' && '📖'}
                    {task.type === 'writing' && '✍️'}
                    {task.type === 'review' && '🔄'}
                    {' '}{task.title}
                  </span>
                  <span className="lesson-duration">
                    <Clock size={14} /> {task.durationMinutes} min
                  </span>
                </div>

                {/* Vocabulary */}
                {task.type === 'vocabulary' && task.content?.words && (
                  <div className="vocab-list">
                    {task.content.words.slice(0, 5).map((w: any, j: number) => (
                      <div key={j} className="vocab-item">
                        <strong>{w.swedish}</strong>
                        <span>{w.translation}</span>
                      </div>
                    ))}
                    {task.content.words.length > 5 && (
                      <div className="vocab-more">
                        +{task.content.words.length - 5} more
                      </div>
                    )}
                  </div>
                )}

                {/* Grammar */}
                {task.type === 'grammar' && task.content?.topic && (
                  <div className="grammar-preview">
                    <p className="grammar-topic">{task.content.topic}</p>
                    <p className="grammar-explain">{task.content.explanation?.substring(0, 150)}...</p>
                    <span className="lesson-exercise-count">
                      {task.content.exercises?.length || 0} {lang === 'zh' ? '道练习' : 'exercises'}
                    </span>
                  </div>
                )}

                {/* Reading */}
                {task.type === 'reading' && task.content?.title && (
                  <div className="reading-preview">
                    <p className="reading-title">{task.content.title}</p>
                    <p className="reading-text">{task.content.text?.substring(0, 120)}...</p>
                  </div>
                )}

                {/* Writing */}
                {task.type === 'writing' && task.content?.prompt && (
                  <div className="writing-preview">
                    <p>{task.content.prompt}</p>
                  </div>
                )}

                <Link href={`/${lang}/dashboard/lesson`} className="btn btn-secondary lesson-start-btn">
                  {lang === 'zh' ? '开始' : 'Start'} <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}

        {!lesson && !generating && !lessonError && (
          <div className="dash-empty-state">
            <Sparkles size={40} className="dash-empty-icon" />
            <p>{t.noTasks}</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="dash-section">
        <h2 className="dash-section-title">{t.quickActions}</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <Link key={action.key} href={action.href} className="quick-action-card">
              <div className="quick-action-icon" style={{ background: `${action.color}15`, color: action.color }}>
                <action.icon size={22} />
              </div>
              <span className="quick-action-label">{t[action.key]}</span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .dash-home { max-width: 900px; }
        .dash-welcome { margin-bottom: 2rem; }
        .dash-welcome h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; }
        .dash-welcome p { color: var(--muted-foreground); margin-top: 0.25rem; font-size: 0.9375rem; }
        .dash-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
        .stat-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-lg); }
        .stat-value { font-size: 1.25rem; font-weight: 800; }
        .stat-label { font-size: 0.8125rem; color: var(--muted-foreground); }
        .dash-section { margin-bottom: 2rem; }
        .dash-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .dash-section-title { font-size: 1.125rem; font-weight: 700; }

        .unit-progress-bar {
          padding: 1rem 1.25rem; background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06));
          border: 1px solid var(--border); border-radius: var(--radius-xl); margin-bottom: 0.75rem;
        }
        .unit-progress-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .unit-progress-label { font-weight: 700; font-size: 0.9375rem; }
        .unit-progress-count { font-size: 0.8125rem; color: var(--muted-foreground); }
        .unit-progress-track { height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; }
        .unit-progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary-500), #8b5cf6); border-radius: 999px; transition: width 0.5s ease; }

        .dash-generating {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 3rem; background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); text-align: center;
        }
        .dash-generating p { color: var(--muted-foreground); margin-top: 1rem; font-size: 0.9375rem; }
        .spin { animation: spinner 1s linear infinite; color: var(--color-primary-500); }
        @keyframes spinner { to { transform: rotate(360deg); } }

        .dash-info-msg {
          padding: 1rem 1.25rem; background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.15); border-radius: var(--radius-lg);
          color: var(--muted-foreground); font-size: 0.9375rem;
        }

        .lesson-cards { display: flex; flex-direction: column; gap: 1rem; }
        .lesson-card {
          padding: 1.25rem; background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); transition: border-color 0.2s;
        }
        .lesson-card:hover { border-color: var(--color-primary-300); }
        .lesson-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
        .lesson-type-badge {
          font-size: 0.8125rem; font-weight: 600; padding: 0.25rem 0.75rem;
          border-radius: 999px; background: var(--muted);
        }
        .lesson-type-badge.vocabulary { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
        .lesson-type-badge.grammar { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }
        .lesson-type-badge.reading { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
        .lesson-type-badge.writing { background: rgba(245, 158, 11, 0.08); color: #d97706; }
        .lesson-type-badge.review { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .lesson-duration { font-size: 0.8125rem; color: var(--muted-foreground); display: flex; align-items: center; gap: 0.25rem; }

        .vocab-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; margin-bottom: 0.75rem; }
        .vocab-item {
          display: flex; justify-content: space-between; padding: 0.5rem 0.75rem;
          background: var(--muted); border-radius: var(--radius-md); font-size: 0.875rem;
        }
        .vocab-item strong { color: var(--color-primary-600); }
        .vocab-more { font-size: 0.8125rem; color: var(--muted-foreground); padding: 0.5rem 0.75rem; }

        .grammar-preview { margin-bottom: 0.75rem; }
        .grammar-topic { font-weight: 700; font-size: 0.9375rem; margin-bottom: 0.25rem; }
        .grammar-explain { font-size: 0.875rem; color: var(--muted-foreground); line-height: 1.5; }
        .lesson-exercise-count {
          display: inline-block; margin-top: 0.5rem; font-size: 0.8125rem; font-weight: 600;
          color: var(--color-primary-500);
        }

        .reading-preview, .writing-preview { margin-bottom: 0.75rem; }
        .reading-title { font-weight: 600; margin-bottom: 0.25rem; }
        .reading-text, .writing-preview p { font-size: 0.875rem; color: var(--muted-foreground); line-height: 1.5; }

        .lesson-start-btn { margin-top: 0.5rem; font-size: 0.8125rem; padding: 0.5rem 1rem; }

        .dash-empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 3rem; background: var(--card); border: 1px dashed var(--border);
          border-radius: var(--radius-xl); text-align: center;
        }
        .dash-empty-icon { color: var(--muted-foreground); opacity: 0.4; margin-bottom: 1rem; }
        .dash-empty-state p { color: var(--muted-foreground); font-size: 0.9375rem; }

        .quick-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .quick-action-card {
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
          padding: 1.5rem 1rem; background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); text-decoration: none; color: var(--foreground);
          transition: all 0.2s ease;
        }
        .quick-action-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.06); }
        .quick-action-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-lg); }
        .quick-action-label { font-size: 0.8125rem; font-weight: 600; text-align: center; }

        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: 1fr; }
          .quick-actions-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-section-header { flex-direction: column; gap: 0.75rem; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}
