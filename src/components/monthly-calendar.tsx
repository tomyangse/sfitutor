'use client'

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { Flame, Star } from 'lucide-react'

interface Props {
  studyDays: string[] // ISO date strings 'YYYY-MM-DD'
  lang: 'en' | 'zh'
}

export function MonthlyCalendar({ studyDays, lang }: Props) {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = 'yyyy-MM-dd'
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  })

  const weekDays = lang === 'zh' 
    ? ['一', '二', '三', '四', '五', '六', '日']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  // Convert studyDays strings to Date objects to avoid timezone issues when matching
  const studiedDates = studyDays.map(d => new Date(d))

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3>{lang === 'zh' ? `${format(today, 'yyyy年 M月')}学习日历` : format(today, 'MMMM yyyy')}</h3>
      </div>
      
      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        
        {calendarDays.map((day, i) => {
          const isCurrentMonth = day.getMonth() === today.getMonth()
          const isStudied = studiedDates.some(d => isSameDay(d, day))
          const isTodayDate = isToday(day)
          
          return (
            <div 
              key={i} 
              className={`calendar-day 
                ${!isCurrentMonth ? 'other-month' : ''} 
                ${isTodayDate ? 'is-today' : ''} 
                ${isStudied ? 'is-studied' : ''}
              `}
            >
              <div className="day-number">{format(day, 'd')}</div>
              {isStudied && (
                <div className="studied-indicator">
                  <Flame size={14} strokeWidth={3} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .calendar-container {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .calendar-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }
        .calendar-weekday {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--muted-foreground);
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          position: relative;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        :global(.dark) .calendar-day {
          background: rgba(255, 255, 255, 0.03);
        }
        .calendar-day.other-month {
          opacity: 0.3;
        }
        .calendar-day.is-today {
          border-color: var(--color-primary-500);
          color: var(--color-primary-600);
        }
        :global(.dark) .calendar-day.is-today {
          color: var(--color-primary-400);
        }
        .calendar-day.is-studied {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
        }
        .day-number {
          z-index: 1;
        }
        .studied-indicator {
          position: absolute;
          bottom: 2px;
          color: #ef4444;
        }
      `}</style>
    </div>
  )
}
