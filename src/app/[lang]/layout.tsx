export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { hasLocale, getDictionary } from './dictionaries'
import type { Locale } from './dictionaries'
import { Navbar } from '@/components/navbar'

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'zh' }]
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang as Locale)
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang as Locale)

  return (
    <>
      <Navbar dict={dict} lang={lang as Locale} />
      <main>{children}</main>
    </>
  )
}
