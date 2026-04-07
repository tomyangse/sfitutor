import { hasLocale } from '../../dictionaries'
import type { Locale } from '../../dictionaries'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgressView } from '@/components/progress-view'

export default async function ProgressPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch SRS stats
  const { count: totalCards } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const todayStr = new Date().toISOString().split('T')[0]
  const { count: dueCards } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review', todayStr)

  // Fetch history grouped by date
  const { data: rawTasks } = await supabase
    .from('daily_tasks')
    .select('id, date, task_type, completed, duration_minutes, content')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: true })

  // Group tasks by date
  const groupedDates: Record<string, any[]> = {}
  if (rawTasks) {
    for (const task of rawTasks) {
      if (!groupedDates[task.date]) groupedDates[task.date] = []
      groupedDates[task.date].push(task)
    }
  }

  return (
    <ProgressView 
      totalCards={totalCards}
      dueCards={dueCards}
      groupedDates={groupedDates}
      lang={lang as Locale}
    />
  )
}
