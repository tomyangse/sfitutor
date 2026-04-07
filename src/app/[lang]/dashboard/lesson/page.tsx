import { getDictionary } from '@/app/[lang]/dictionaries'
import type { Locale } from '@/app/[lang]/dictionaries'
import { LessonView } from '@/components/lesson-view'

export default async function LessonPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  const dict = await getDictionary(lang as Locale)

  return <LessonView dict={dict} lang={lang as Locale} />
}
