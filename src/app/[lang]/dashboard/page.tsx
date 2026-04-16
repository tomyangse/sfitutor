import { getDictionary, hasLocale } from '../dictionaries'
import type { Locale } from '../dictionaries'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHome } from '@/components/dashboard-home'
import { getLearningProgress } from '@/lib/ai/progress-tracker'
import { getCurriculum } from '@/lib/curriculum'

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: studyDaysData } = await supabase
    .from('daily_tasks')
    .select('date')
    .eq('user_id', user!.id)
    .eq('completed', true)

  const studyDays = [...new Set(studyDaysData?.map(d => d.date) || [])]

  const dict = await getDictionary(lang as Locale)

  let progressData = null;
  if (profile?.current_level) {
    try {
      const prog = await getLearningProgress(user!.id)
      const curriculum = getCurriculum(profile.current_level as any)
      progressData = {
        completed: prog.completedUnits.length,
        total: curriculum.units.length
      }
    } catch (e) {
      console.error(e)
    }
  }

  return <DashboardHome dict={dict} lang={lang as Locale} profile={profile} progressData={progressData} studyDays={studyDays} />
}
