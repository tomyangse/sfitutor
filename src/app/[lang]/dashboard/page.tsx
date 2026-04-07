import { getDictionary, hasLocale } from '../dictionaries'
import type { Locale } from '../dictionaries'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHome } from '@/components/dashboard-home'

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

  const dict = await getDictionary(lang as Locale)

  return <DashboardHome dict={dict} lang={lang as Locale} profile={profile} />
}
