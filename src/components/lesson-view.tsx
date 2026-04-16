'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, ChevronRight, ChevronLeft, Check, X, Volume2,
  ArrowLeft, Trophy, BookOpen, Eye, EyeOff
} from 'lucide-react'
import type { Locale } from '@/app/[lang]/dictionaries'

// In-memory audio cache to avoid duplicate TTS API calls
const audioCache = new Map<string, string>()
let currentAudio: HTMLAudioElement | null = null

const playAudio = async (text: string, e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Strip parenthesized translations (e.g. Chinese/pinyin) — only read Swedish
  text = text.replace(/\s*\(.*?\)\s*/g, ' ').trim();

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  try {
    let blobUrl = audioCache.get(text);

    if (!blobUrl) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('TTS failed');

      const blob = await res.blob();
      blobUrl = URL.createObjectURL(blob);
      audioCache.set(text, blobUrl);
    }

    const audio = new Audio(blobUrl);
    currentAudio = audio;
    await audio.play();
  } catch (err) {
    console.error('TTS playback error:', err);
    // Fallback to browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }
}

interface Props {
  dict: Record<string, any>
  lang: Locale
}

export function LessonView({ dict, lang }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  useEffect(() => {
    loadLesson()
  }, [])

  const loadLesson = async () => {
    try {
      const res = await fetch('/api/lesson/today')
      const data = await res.json()
      if (data.lesson?.tasks) {
        setTasks(data.lesson.tasks)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskComplete = async (correct: number, total: number) => {
    const task = tasks[currentTaskIdx]
    
    // Fire and forget to markup the task as completed in DB
    if (task?.id) {
      fetch('/api/lesson/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id })
      }).catch(err => console.error('Failed to mark task complete', err))
    }

    setScore(prev => ({ correct: prev.correct + correct, total: prev.total + total }))
    if (currentTaskIdx < tasks.length - 1) {
      setCurrentTaskIdx(prev => prev + 1)
    } else {
      setCompleted(true)
    }
  }

  if (loading) {
    return (
      <div className="lesson-loading">
        <Loader2 size={32} className="spin" />
        <p>{lang === 'zh' ? '加载课程...' : 'Loading lesson...'}</p>
        <style jsx>{`
          .lesson-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:1rem; }
          .spin { animation: spin 1s linear infinite; color: var(--color-primary-500); }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="lesson-loading">
        <p>{lang === 'zh' ? '没有今日课程，请先生成' : 'No lesson today. Generate one first.'}</p>
        <button className="btn btn-primary" onClick={() => router.push(`/${lang}/dashboard`)}>
          {lang === 'zh' ? '返回' : 'Go Back'}
        </button>
      </div>
    )
  }

  if (completed) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100
    return (
      <div className="lesson-complete">
        <div className="lesson-complete-card">
          <Trophy size={48} className="trophy-icon" />
          <h1>{lang === 'zh' ? '今日学习完成！' : 'Lesson Complete!'}</h1>
          <div className="score-circle">
            <span className="score-pct">{pct}%</span>
          </div>
          <p className="score-detail">
            {lang === 'zh'
              ? `${score.correct} / ${score.total} 正确`
              : `${score.correct} / ${score.total} correct`
            }
          </p>
          <button className="btn btn-primary" onClick={() => router.push(`/${lang}/dashboard`)}>
            {lang === 'zh' ? '返回仪表盘' : 'Back to Dashboard'}
          </button>
        </div>
        <style jsx>{`
          .lesson-complete { display:flex; align-items:center; justify-content:center; min-height:60vh; }
          .lesson-complete-card { text-align:center; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-2xl); padding:3rem; max-width:400px; width:100%; }
          .trophy-icon { color:#f59e0b; margin-bottom:1rem; }
          .lesson-complete-card h1 { font-size:1.5rem; font-weight:800; margin-bottom:1.5rem; }
          .score-circle {
            width:100px; height:100px; border-radius:50%; margin:0 auto 1rem;
            background:linear-gradient(135deg, var(--color-primary-500), #8b5cf6);
            display:flex; align-items:center; justify-content:center;
          }
          .score-pct { color:white; font-size:1.5rem; font-weight:800; }
          .score-detail { color:var(--muted-foreground); margin-bottom:1.5rem; }
        `}</style>
      </div>
    )
  }

  const task = tasks[currentTaskIdx]

  return (
    <div className="lesson-page">
      {/* Header bar */}
      <div className="lesson-header">
        <button className="lesson-back" onClick={() => router.push(`/${lang}/dashboard`)}>
          <ArrowLeft size={20} />
        </button>
        <div className="lesson-progress-bar">
          <div className="lesson-progress-fill" style={{ width: `${((currentTaskIdx + 1) / tasks.length) * 100}%` }} />
        </div>
        <span className="lesson-step-count">{currentTaskIdx + 1}/{tasks.length}</span>
      </div>

      {/* Task content */}
      <div className="lesson-content">
        {task.type === 'vocabulary' && (
          <VocabularyTask task={task} lang={lang} onComplete={handleTaskComplete} />
        )}
        {task.type === 'grammar' && (
          <GrammarTask task={task} lang={lang} onComplete={handleTaskComplete} />
        )}
        {task.type === 'reading' && (
          <ReadingTask task={task} lang={lang} onComplete={handleTaskComplete} />
        )}
        {task.type === 'writing' && (
          <WritingTask task={task} lang={lang} onComplete={handleTaskComplete} />
        )}
        {task.type === 'review' && (
          <ReviewTask task={task} lang={lang} onComplete={handleTaskComplete} />
        )}
      </div>

      <style jsx>{`
        .lesson-page { max-width:700px; margin:0 auto; padding:1rem; }
        .lesson-header { display:flex; align-items:center; gap:1rem; margin-bottom:2rem; }
        .lesson-back { background:none; border:none; cursor:pointer; color:var(--muted-foreground); padding:0.5rem; border-radius:var(--radius-md); }
        .lesson-back:hover { background:var(--muted); }
        .lesson-progress-bar { flex:1; height:8px; background:var(--border); border-radius:999px; overflow:hidden; }
        .lesson-progress-fill { height:100%; background:linear-gradient(90deg, var(--color-primary-500), #22c55e); border-radius:999px; transition:width 0.5s ease; }
        .lesson-step-count { font-size:0.8125rem; font-weight:600; color:var(--muted-foreground); min-width:2.5rem; text-align:right; }
        .lesson-content { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}

// ======================================
// VOCABULARY TASK
// ======================================
function VocabularyTask({ task, lang, onComplete }: { task: any, lang: Locale, onComplete: (c: number, t: number) => void }) {
  const words = task.content?.words || []
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [known, setKnown] = useState(0)

  // Register new words to DB immediately when task starts
  useEffect(() => {
    if (words.length > 0) {
      fetch('/api/flashcards/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: words.map((w: any) => ({
            front: w.swedish,
            back: w.translation,
            tags: ['new_lesson']
          }))
        })
      }).catch(err => console.error('Failed to add words:', err))
    }
  }, [words])

  if (idx >= words.length) {
    return (
      <div className="task-done">
        <Check size={32} className="task-done-icon" />
        <h2>{lang === 'zh' ? '词汇学习完成！' : 'Vocabulary done!'}</h2>
        <p>{lang === 'zh' ? `记住了 ${known}/${words.length} 个词` : `Knew ${known}/${words.length} words`}</p>
        <button className="btn btn-primary" onClick={() => onComplete(known, words.length)}>
          {lang === 'zh' ? '继续' : 'Continue'} <ChevronRight size={16} />
        </button>
        <style jsx>{`
          .task-done { text-align:center; padding:3rem 1rem; }
          .task-done-icon { color:#22c55e; margin-bottom:1rem; }
          .task-done h2 { font-size:1.25rem; font-weight:700; margin-bottom:0.5rem; }
          .task-done p { color:var(--muted-foreground); margin-bottom:1.5rem; }
        `}</style>
      </div>
    )
  }

  const word = words[idx]

  const handleReview = (quality: number) => {
    // Fire and forget review to SM-2 algo
    fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front: word.swedish, quality })
    }).catch(err => console.error('SM-2 review failed:', err))

    if (quality >= 3) setKnown(prev => prev + 1)
    setRevealed(false)
    setIdx(idx + 1)
  }

  return (
    <div className="vocab-task">
      <h2 className="task-title">📝 {lang === 'zh' ? '词汇学习' : 'Vocabulary'}</h2>
      <p className="task-counter">{idx + 1} / {words.length}</p>

      <div className={`flashcard ${revealed ? 'flipped' : ''}`} onClick={() => setRevealed(!revealed)}>
        <div className="flashcard-front">
          <div className="word-with-audio">
            <span className="flashcard-word">{word.swedish}</span>
            <button className="play-btn" onClick={(e) => playAudio(word.swedish, e)} title="Play"><Volume2 size={28} /></button>
          </div>
          <span className="flashcard-hint">{lang === 'zh' ? '点击翻转' : 'Tap to reveal'}</span>
        </div>
        {revealed && (
          <div className="flashcard-back">
            <div className="word-with-audio">
              <span className="flashcard-word">{word.swedish}</span>
              <button className="play-btn" onClick={(e) => playAudio(word.swedish, e)} title="Play"><Volume2 size={28} /></button>
            </div>
            <span className="flashcard-translation">{word.translation}</span>
            {word.example && (
              <div className="example-with-audio">
                <span className="flashcard-example">"{word.example}"</span>
                <button className="play-btn mini" onClick={(e) => playAudio(word.example, e)} title="Play"><Volume2 size={18} /></button>
              </div>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <div className="vocab-actions">
          <button className="vocab-btn unknown" onClick={() => handleReview(1)}>
            <X size={18} /> {lang === 'zh' ? '不认识' : "Don't know"}
          </button>
          <button className="vocab-btn known" onClick={() => handleReview(4)}>
            <Check size={18} /> {lang === 'zh' ? '认识' : 'Know it'}
          </button>
        </div>
      )}

      <style jsx>{`
        .vocab-task { text-align:center; }
        .task-title { font-size:1.25rem; font-weight:700; margin-bottom:0.25rem; }
        .task-counter { color:var(--muted-foreground); font-size:0.875rem; margin-bottom:1.5rem; }
        .flashcard {
          background:var(--card); border:2px solid var(--border); border-radius:var(--radius-2xl);
          padding:3rem 2rem; cursor:pointer; transition:all 0.3s ease; min-height:200px;
          display:flex; align-items:center; justify-content:center; flex-direction:column;
        }
        .flashcard:hover { border-color:var(--color-primary-300); box-shadow:0 8px 30px rgba(0,0,0,0.06); }
        .flashcard-front, .flashcard-back { display:flex; flex-direction:column; align-items:center; gap:0.75rem; }
        .flashcard-word { font-size:2rem; font-weight:800; color:var(--color-primary-600); }
        .flashcard-hint { font-size:0.8125rem; color:var(--muted-foreground); }
        .flashcard-translation { font-size:1.25rem; font-weight:600; }
        .flashcard-example { font-size:0.9375rem; color:var(--muted-foreground); font-style:italic; max-width:350px; }
        .vocab-actions { display:flex; gap:1rem; justify-content:center; margin-top:1.5rem; }
        .vocab-btn {
          display:flex; align-items:center; gap:0.5rem; padding:0.75rem 1.5rem;
          border-radius:var(--radius-lg); font-weight:600; cursor:pointer; border:2px solid;
          font-size:0.9375rem; transition:all 0.2s;
        }
        .vocab-btn.unknown { background:rgba(239,68,68,0.06); border-color:rgba(239,68,68,0.2); color:#ef4444; }
        .vocab-btn.unknown:hover { background:rgba(239,68,68,0.12); }
        .vocab-btn.known { background:rgba(34,197,94,0.06); border-color:rgba(34,197,94,0.2); color:#16a34a; }
        .vocab-btn.known:hover { background:rgba(34,197,94,0.12); }
        .word-with-audio { display:flex; align-items:center; gap:0.75rem; }
        .example-with-audio { display:flex; align-items:center; gap:0.5rem; justify-content:center; }
        .play-btn { background:rgba(59,130,246,0.1); border:none; cursor:pointer; color:var(--color-primary-600); padding:0.5rem; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .play-btn:hover { background:rgba(59,130,246,0.2); transform:scale(1.05); }
        .play-btn.mini { padding:0.35rem; }
      `}</style>
    </div>
  )
}

// ======================================
// GRAMMAR TASK
// ======================================
function GrammarTask({ task, lang, onComplete }: { task: any, lang: Locale, onComplete: (c: number, t: number) => void }) {
  const content = task.content || {}
  const exercises = content.exercises || []
  const [phase, setPhase] = useState<'learn' | 'practice' | 'done'>('learn')
  const [exIdx, setExIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correct, setCorrect] = useState(0)

  if (phase === 'learn') {
    return (
      <div className="grammar-learn">
        <h2 className="task-title">📐 {content.topic}</h2>
        <div className="grammar-explanation">{content.explanation}</div>
        {content.examples?.map((ex: any, i: number) => (
          <div key={i} className="grammar-example">
            <div className="example-sv-row">
              <span className="example-sv">{ex.swedish}</span>
              <button className="play-btn-inline" onClick={() => playAudio(ex.swedish)} title="Play"><Volume2 size={16} /></button>
            </div>
            <span className="example-tr">{ex.translation}</span>
          </div>
        ))}
        <button className="btn btn-primary" onClick={() => setPhase('practice')}>
          {lang === 'zh' ? '开始练习' : 'Start Exercises'} <ChevronRight size={16} />
        </button>
        <style jsx>{`
          .grammar-learn { }
          .task-title { font-size:1.25rem; font-weight:700; margin-bottom:1rem; }
          .grammar-explanation { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-xl); padding:1.25rem; margin-bottom:1.25rem; line-height:1.7; font-size:0.9375rem; }
          .grammar-example { display:flex; flex-direction:column; gap:0.125rem; padding:0.75rem 1rem; background:rgba(59,130,246,0.04); border-left:3px solid var(--color-primary-500); border-radius:0 var(--radius-md) var(--radius-md) 0; margin-bottom:0.5rem; }
          .example-sv { font-weight:600; color:var(--color-primary-600); }
          .example-tr { font-size:0.875rem; color:var(--muted-foreground); }
          .example-sv-row { display:flex; align-items:center; gap:0.5rem; }
          .play-btn-inline { background:none; border:none; cursor:pointer; color:var(--color-primary-500); padding:0.25rem; display:flex; align-items:center; justify-content:center; opacity:0.7; transition:opacity 0.2s; }
          .play-btn-inline:hover { opacity:1; }
        `}</style>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="task-done" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Check size={32} style={{ color: '#22c55e', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{lang === 'zh' ? '语法练习完成！' : 'Grammar done!'}</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>{correct}/{exercises.length} {lang === 'zh' ? '正确' : 'correct'}</p>
        <button className="btn btn-primary" onClick={() => onComplete(correct, exercises.length)}>
          {lang === 'zh' ? '继续' : 'Continue'} <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  const ex = exercises[exIdx]

  return (
    <div className="grammar-practice">
      <h2 className="task-title">📐 {lang === 'zh' ? '语法练习' : 'Grammar Exercise'} ({exIdx + 1}/{exercises.length})</h2>
      <div className="exercise-question">{ex.question}</div>

      {ex.options && ex.options.length > 0 ? (
        <div className="exercise-options">
          {ex.options.map((opt: string, i: number) => {
            let cls = 'exercise-option'
            if (showResult) {
              if (opt === ex.answer) cls += ' correct'
              else if (opt === selected) cls += ' wrong'
            } else if (opt === selected) {
              cls += ' selected'
            }
            return (
              <button key={i} className={cls} onClick={() => { if (!showResult) setSelected(opt) }} disabled={showResult}>
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          className="exercise-input"
          placeholder={lang === 'zh' ? '输入答案...' : 'Type your answer...'}
          value={selected || ''}
          onChange={e => setSelected(e.target.value)}
          disabled={showResult}
        />
      )}

      {!showResult && selected && (
        <button className="btn btn-primary" onClick={() => {
          if (selected === ex.answer) setCorrect(correct + 1)
          setShowResult(true)
        }}>
          {lang === 'zh' ? '检查' : 'Check'}
        </button>
      )}

      {showResult && (
        <div className={`exercise-feedback ${selected === ex.answer ? 'correct' : 'wrong'}`}>
          {selected === ex.answer
            ? (lang === 'zh' ? '✅ 正确！' : '✅ Correct!')
            : (lang === 'zh' ? `❌ 正确答案: ${ex.answer}` : `❌ Correct answer: ${ex.answer}`)
          }
          {ex.hint && <p className="exercise-hint">💡 {ex.hint}</p>}
          <button className="btn btn-primary" style={{ marginTop: '1rem' }}
            onClick={() => {
              if (exIdx < exercises.length - 1) {
                setExIdx(exIdx + 1); setSelected(null); setShowResult(false)
              } else {
                setPhase('done')
              }
            }}>
            {lang === 'zh' ? '下一题' : 'Next'} <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style jsx>{`
        .grammar-practice { }
        .task-title { font-size:1.25rem; font-weight:700; margin-bottom:1.5rem; }
        .exercise-question { font-size:1.125rem; font-weight:600; margin-bottom:1.25rem; padding:1rem; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-xl); }
        .exercise-options { display:flex; flex-direction:column; gap:0.625rem; margin-bottom:1rem; }
        .exercise-option {
          padding:0.875rem 1.25rem; border:2px solid var(--border); border-radius:var(--radius-lg);
          background:var(--card); cursor:pointer; font-size:0.9375rem; text-align:left; transition:all 0.2s;
        }
        .exercise-option:hover:not(:disabled) { border-color:var(--color-primary-300); }
        .exercise-option.selected { border-color:var(--color-primary-500); background:rgba(59,130,246,0.06); }
        .exercise-option.correct { border-color:#22c55e; background:rgba(34,197,94,0.08); }
        .exercise-option.wrong { border-color:#ef4444; background:rgba(239,68,68,0.08); }
        .exercise-input {
          width:100%; padding:0.875rem 1.25rem; border:2px solid var(--border); border-radius:var(--radius-lg);
          font-size:1rem; margin-bottom:1rem; background:var(--card);
        }
        .exercise-feedback {
          padding:1rem 1.25rem; border-radius:var(--radius-lg); margin-top:1rem; font-weight:600;
        }
        .exercise-feedback.correct { background:rgba(34,197,94,0.08); color:#16a34a; }
        .exercise-feedback.wrong { background:rgba(239,68,68,0.08); color:#ef4444; }
        .exercise-hint { font-weight:400; font-size:0.875rem; margin-top:0.5rem; opacity:0.8; }
      `}</style>
    </div>
  )
}

// ======================================
// READING TASK
// ======================================
function ReadingTask({ task, lang, onComplete }: { task: any, lang: Locale, onComplete: (c: number, t: number) => void }) {
  const content = task.content || {}
  const questions = content.questions || []
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Check size={32} style={{ color: '#22c55e', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{lang === 'zh' ? '阅读理解完成！' : 'Reading done!'}</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>{correct}/{questions.length} {lang === 'zh' ? '正确' : 'correct'}</p>
        <button className="btn btn-primary" onClick={() => onComplete(correct, questions.length)}>
          {lang === 'zh' ? '继续' : 'Continue'} <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  const q = questions[qIdx]

  return (
    <div className="reading-task">
      <h2 className="task-title">📖 {content.title || (lang === 'zh' ? '阅读理解' : 'Reading')}</h2>
      <div className="reading-passage">{content.text}</div>

      {q && (
        <>
          <div className="reading-question">{q.question}</div>
          <div className="exercise-options">
            {q.options?.map((opt: string, i: number) => {
              let cls = 'exercise-option'
              if (showResult) {
                if (i === q.correctAnswer) cls += ' correct'
                else if (i === selected) cls += ' wrong'
              } else if (i === selected) cls += ' selected'
              return (
                <button key={i} className={cls} onClick={() => { if (!showResult) setSelected(i) }} disabled={showResult}>
                  {opt}
                </button>
              )
            })}
          </div>

          {!showResult && selected !== null && (
            <button className="btn btn-primary" onClick={() => {
              if (selected === q.correctAnswer) setCorrect(correct + 1)
              setShowResult(true)
            }}>
              {lang === 'zh' ? '检查' : 'Check'}
            </button>
          )}

          {showResult && (
            <div className={`exercise-feedback ${selected === q.correctAnswer ? 'correct' : 'wrong'}`}>
              {selected === q.correctAnswer
                ? (lang === 'zh' ? '✅ 正确！' : '✅ Correct!')
                : (lang === 'zh' ? '❌ 错误' : '❌ Incorrect')
              }
              {q.explanation && <p style={{ fontWeight: 400, fontSize: '0.875rem', marginTop: '0.5rem' }}>{q.explanation}</p>}
              <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                onClick={() => {
                  if (qIdx < questions.length - 1) {
                    setQIdx(qIdx + 1); setSelected(null); setShowResult(false)
                  } else {
                    setDone(true)
                  }
                }}>
                {lang === 'zh' ? '下一题' : 'Next'} <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .reading-task { }
        .task-title { font-size:1.25rem; font-weight:700; margin-bottom:1rem; }
        .reading-passage {
          background:var(--card); border:1px solid var(--border); border-radius:var(--radius-xl);
          padding:1.5rem; line-height:1.8; font-size:1rem; margin-bottom:1.5rem; white-space:pre-wrap;
        }
        .reading-question { font-weight:600; font-size:1.0625rem; margin-bottom:1rem; }
        .exercise-options { display:flex; flex-direction:column; gap:0.625rem; margin-bottom:1rem; }
        .exercise-option {
          padding:0.875rem 1.25rem; border:2px solid var(--border); border-radius:var(--radius-lg);
          background:var(--card); cursor:pointer; font-size:0.9375rem; text-align:left; transition:all 0.2s;
        }
        .exercise-option:hover:not(:disabled) { border-color:var(--color-primary-300); }
        .exercise-option.selected { border-color:var(--color-primary-500); background:rgba(59,130,246,0.06); }
        .exercise-option.correct { border-color:#22c55e; background:rgba(34,197,94,0.08); }
        .exercise-option.wrong { border-color:#ef4444; background:rgba(239,68,68,0.08); }
        .exercise-feedback {
          padding:1rem 1.25rem; border-radius:var(--radius-lg); margin-top:1rem; font-weight:600;
        }
        .exercise-feedback.correct { background:rgba(34,197,94,0.08); color:#16a34a; }
        .exercise-feedback.wrong { background:rgba(239,68,68,0.08); color:#ef4444; }
      `}</style>
    </div>
  )
}

// ======================================
// WRITING TASK
// ======================================
function WritingTask({ task, lang, onComplete }: { task: any, lang: Locale, onComplete: (c: number, t: number) => void }) {
  const content = task.content || {}
  const [text, setText] = useState('')

  return (
    <div className="writing-task">
      <h2 className="task-title">✍️ {lang === 'zh' ? '写作练习' : 'Writing Practice'}</h2>
      <div className="writing-prompt">
        <p className="prompt-text">{content.prompt}</p>
        {content.instructions && <p className="prompt-instructions">{content.instructions}</p>}
      </div>
      {content.exampleStructure && (
        <div className="writing-structure">
          <strong>{lang === 'zh' ? '参考结构:' : 'Suggested structure:'}</strong>
          <p>{content.exampleStructure}</p>
        </div>
      )}
      <textarea
        className="writing-area"
        placeholder={lang === 'zh' ? '用瑞典语写...' : 'Write in Swedish...'}
        value={text}
        onChange={e => setText(e.target.value)}
        rows={8}
      />
      <div className="writing-footer">
        <span className="word-count">
          {text.split(/\s+/).filter(Boolean).length} / {content.wordCountTarget || 50} {lang === 'zh' ? '词' : 'words'}
        </span>
        <button className="btn btn-primary" onClick={() => onComplete(1, 1)} disabled={text.trim().length < 10}>
          {lang === 'zh' ? '提交' : 'Submit'} <Check size={16} />
        </button>
      </div>
      <style jsx>{`
        .writing-task { }
        .task-title { font-size:1.25rem; font-weight:700; margin-bottom:1rem; }
        .writing-prompt { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-xl); padding:1.25rem; margin-bottom:1rem; }
        .prompt-text { font-weight:600; font-size:1.0625rem; margin-bottom:0.5rem; }
        .prompt-instructions { font-size:0.9375rem; color:var(--muted-foreground); line-height:1.6; }
        .writing-structure { background:rgba(139,92,246,0.04); border-left:3px solid #8b5cf6; padding:0.75rem 1rem; border-radius:0 var(--radius-md) var(--radius-md) 0; margin-bottom:1rem; font-size:0.9375rem; }
        .writing-area {
          width:100%; padding:1rem; border:2px solid var(--border); border-radius:var(--radius-lg);
          font-size:1rem; line-height:1.7; resize:vertical; background:var(--card); font-family:inherit;
        }
        .writing-area:focus { border-color:var(--color-primary-500); outline:none; }
        .writing-footer { display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem; }
        .word-count { font-size:0.8125rem; color:var(--muted-foreground); }
      `}</style>
    </div>
  )
}

// ======================================
// REVIEW TASK (Flashcards)
// ======================================
function ReviewTask({ task, lang, onComplete }: { task: any, lang: Locale, onComplete: (c: number, t: number) => void }) {
  const cards = task.content?.flashcards || []
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)

  if (idx >= cards.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Check size={32} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{lang === 'zh' ? '复习完成！' : 'Review done!'}</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>{known}/{cards.length} {lang === 'zh' ? '正确' : 'correct'}</p>
        <button className="btn btn-primary" onClick={() => onComplete(known, cards.length)}>
          {lang === 'zh' ? '继续' : 'Continue'} <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  const card = cards[idx]

  const handleReview = (quality: number) => {
    fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, front: card.front, quality })
    }).catch(err => console.error('SM-2 review failed:', err))

    if (quality >= 3) setKnown(prev => prev + 1)
    setFlipped(false)
    setIdx(idx + 1)
  }

  return (
    <div className="review-task" style={{ textAlign: 'center' }}>
      <h2 className="task-title">🔄 {lang === 'zh' ? '复习' : 'Review'} ({idx + 1}/{cards.length})</h2>

      <div className="flashcard" onClick={() => setFlipped(!flipped)} style={{
        background: 'var(--card)', border: '2px solid var(--border)', borderRadius: 'var(--radius-2xl)',
        padding: '3rem 2rem', cursor: 'pointer', minHeight: '180px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: flipped ? 'var(--foreground)' : 'var(--color-primary-600)' }}>
            {flipped ? card.back : card.front}
          </span>
          <button 
            style={{ 
              background: 'rgba(59,130,246,0.1)', border: 'none', cursor: 'pointer', 
              color: 'var(--color-primary-600)', padding: '0.5rem', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }} 
            onClick={(e) => playAudio(card.front, e)}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
          >
            <Volume2 size={24} />
          </button>
        </div>
        {!flipped && <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{lang === 'zh' ? '点击翻转' : 'Tap to flip'}</span>}
      </div>

      {flipped && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => handleReview(1)}>
            <X size={18} /> {lang === 'zh' ? '不熟' : 'Again'}
          </button>
          <button className="btn btn-primary" onClick={() => handleReview(4)}>
            <Check size={18} /> {lang === 'zh' ? '熟悉' : 'Got it'}
          </button>
        </div>
      )}

      <style jsx>{`
        .task-title { font-size:1.25rem; font-weight:700; margin-bottom:1.5rem; }
      `}</style>
    </div>
  )
}
