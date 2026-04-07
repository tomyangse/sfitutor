import { getDictionary, hasLocale } from '../dictionaries'
import type { Locale } from '../dictionaries'
import { notFound } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding-wizard'

export default async function OnboardingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  return <OnboardingWizard dict={dict} lang={lang as Locale} />
}
