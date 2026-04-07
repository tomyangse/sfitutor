import { getDictionary, hasLocale } from './dictionaries'
import type { Locale } from './dictionaries'
import { notFound } from 'next/navigation'
import { LandingPage } from '@/components/landing-page'

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params

  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang as Locale)

  return <LandingPage dict={dict} lang={lang as Locale} />
}
