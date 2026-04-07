'use client'

import { CheckCircle2, Circle, Calendar, BrainCircuit, Activity } from 'lucide-react'
import type { Locale } from '@/app/[lang]/dictionaries'

export function ProgressView({
  totalCards,
  dueCards,
  groupedDates,
  lang
}: {
  totalCards: number | null
  dueCards: number | null
  groupedDates: Record<string, any[]>
  lang: Locale
}) {
  return (
    <div className="progress-page">
      <div className="header">
        <h1>{lang === 'zh' ? '学习记录 (Progress)' : 'Your Progress'}</h1>
        <p>{lang === 'zh' ? '查看你的学习历史与知识网络' : 'View your learning history and knowledge network'}</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon s-1"><BrainCircuit size={24} /></div>
          <div className="stat-val">{totalCards || 0}</div>
          <div className="stat-label">{lang === 'zh' ? '记忆词汇总数' : 'Total Flashcards'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon s-2"><Activity size={24} /></div>
          <div className="stat-val">{dueCards || 0}</div>
          <div className="stat-label">{lang === 'zh' ? '今日待复习 (SRS)' : 'Due for Review'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon s-3"><Calendar size={24} /></div>
          <div className="stat-val">{Object.keys(groupedDates).length}</div>
          <div className="stat-label">{lang === 'zh' ? '累计学习天数' : 'Total Study Days'}</div>
        </div>
      </div>

      <h2 className="history-title">{lang === 'zh' ? '历史足迹' : 'History'}</h2>

      {Object.keys(groupedDates).length === 0 ? (
        <div className="empty-state">
          {lang === 'zh' ? '目前还没有历史记录。完成今天的课程来开始吧！' : 'No history yet. Complete today\'s lesson to start!'}
        </div>
      ) : (
        <div className="timeline">
          {Object.entries(groupedDates).map(([date, tasks]) => {
            const allDone = tasks.every((t: any) => t.completed)
            return (
              <div key={date} className="timeline-day">
                <div className={`day-indicator ${allDone ? 'perfect' : ''}`}>
                  {allDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>
                <div className="day-content">
                  <h3 className="day-date">{date}</h3>
                  <div className="tasks-list">
                    {tasks.map((task: any) => (
                      <div key={task.id} className={`task-row ${task.completed ? 'task-done' : ''}`}>
                        <span className="task-type">{task.task_type.toUpperCase()}</span>
                        <span className="task-desc">
                          {task.content?.topic || task.content?.title || 
                            (task.content?.words ? `${task.content.words.length} items` : 'Generic task')}
                        </span>
                        <span className="task-time">{task.duration_minutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .progress-page {
          max-width: 900px;
        }
        .header {
          margin-bottom: 2rem;
        }
        .header h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .header p {
          color: var(--muted-foreground);
        }
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: transform 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          color: white;
        }
        .stat-icon.s-1 { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
        .stat-icon.s-2 { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
        .stat-icon.s-3 { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
        
        .stat-val {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .stat-label {
          font-size: 0.875rem;
          color: var(--muted-foreground);
          font-weight: 500;
        }
        .history-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .empty-state {
          padding: 3rem;
          text-align: center;
          background: var(--muted);
          border-radius: var(--radius-lg);
          color: var(--muted-foreground);
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .timeline-day {
          display: flex;
          gap: 1.5rem;
        }
        .day-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--muted-foreground);
        }
        .day-indicator.perfect {
          color: #22c55e;
        }
        .day-content {
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
        }
        .day-date {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--foreground);
        }
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .task-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--background);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          border-left: 3px solid transparent;
        }
        .task-row.task-done {
          border-left-color: #22c55e;
        }
        .task-type {
          font-weight: 700;
          font-size: 0.75rem;
          background: var(--muted);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          min-width: 80px;
          text-align: center;
          color: var(--muted-foreground);
        }
        .task-row.task-done .task-type {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }
        .task-desc {
          flex: 1;
          color: var(--foreground);
        }
        .task-time {
          color: var(--muted-foreground);
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 640px) {
          .stats-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
