import { getDictionary, hasLocale } from '../dictionaries'
import type { Locale } from '../dictionaries'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no onboarding done, redirect
  if (!profile?.current_level) {
    redirect(`/${lang}/onboarding`)
  }

  const dict = await getDictionary(lang as Locale)

  return (
    <DashboardShell dict={dict} lang={lang as Locale} profile={profile}>
      {children}
    </DashboardShell>
  )
}
