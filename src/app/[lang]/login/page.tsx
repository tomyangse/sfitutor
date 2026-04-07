import { getDictionary, hasLocale } from '../dictionaries'
import type { Locale } from '../dictionaries'
import { notFound } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  return <AuthForm mode="login" dict={dict} lang={lang as Locale} />
}
