import { generate, generateJSON } from './gemini'
import type { CurriculumUnit } from '../curriculum'

export interface DailyLesson {
  unitId: string
  unitTitle: string
  tasks: DailyTask[]
  estimatedMinutes: number
}

export interface DailyTask {
  type: 'vocabulary' | 'grammar' | 'reading' | 'writing' | 'review'
  title: string
  durationMinutes: number
  content: VocabularyContent | GrammarContent | ReadingContent | WritingContent | ReviewContent
}

export interface VocabularyContent {
  words: Array<{
    swedish: string
    translation: string
    example: string
    pronunciation?: string
  }>
  theme: string
}

export interface GrammarContent {
  topic: string
  explanation: string
  examples: Array<{
    swedish: string
    translation: string
    note?: string
  }>
  exercises: Array<{
    type: 'fill_blank' | 'multiple_choice' | 'transform'
    question: string
    options?: string[]
    answer: string
    hint?: string
  }>
}

export interface ReadingContent {
  title: string
  text: string
  level: string
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
}

export interface WritingContent {
  prompt: string
  instructions: string
  wordCountTarget: number
  exampleStructure: string
  evaluationCriteria: string[]
}

export interface ReviewContent {
  flashcards: Array<{
    id?: string
    front: string
    back: string
    type: 'vocabulary' | 'grammar'
  }>
}

/**
 * Generate a complete daily lesson based on a curriculum unit and task type focus.
 */
export async function generateDailyLesson(
  unit: CurriculumUnit,
  focusAreas: string[],
  dailyMinutes: number,
  locale: string,
  previousVocab: string[] = [],
  dueReviews: { id: string; front: string; back: string }[] = [],
  intensity: string = 'medium'
): Promise<DailyLesson> {
  const motherTongue = locale === 'zh' ? 'Chinese' : 'English'

  const dueVocabList = dueReviews.map(r => `${r.front} (${r.back})`).join(', ')

  let vocabScale = 6;
  let grammarScale = 2;
  let readingScale = 60;

  if (intensity === 'low') {
    vocabScale = 3; grammarScale = 1; readingScale = 40;
  } else if (intensity === 'high') {
    vocabScale = 10; grammarScale = 4; readingScale = 120;
  } else if (intensity === 'extreme') {
    vocabScale = 16; grammarScale = 6; readingScale = 200;
  }

  const systemPrompt = `You are an expert Swedish language teacher creating a daily lesson.

TEACHING LANGUAGE: Explain in ${motherTongue}. All grammar explanations, translations, and instructions must be in ${motherTongue}.
SWEDISH LEVEL: This lesson is for the unit "${unit.title}" (${unit.titleEn}).
INTENSITY LEVEL: ${intensity.toUpperCase()}. Generate content density accordingly.

CONTEXT:
- Grammar points for this unit: ${unit.grammar.join(', ')}
- Vocabulary themes: ${unit.vocabulary.join(', ')}
- Reading skills: ${unit.reading.join(', ')}
- Writing skills: ${unit.writing.join(', ')}

RULES:
- Generate EXACTLY ${dailyMinutes} minutes of content
- All Swedish text must include ${motherTongue} translations
- Vocabulary words must be practical and commonly used
- Grammar exercises must test the specific grammar point
- Reading passages must be at the appropriate level
- Do NOT repeat these previously taught words: ${previousVocab.slice(-50).join(', ')}
- Generate NEW words each time from the same themes`

  const tasks: string[] = []
  let remainingMinutes = dailyMinutes

  // 1. Force review task if dueReviews exist
  let reviewTask: DailyTask | null = null;
  if (dueReviews.length > 0 && remainingMinutes >= 5) {
    reviewTask = {
      type: 'review',
      title: locale === 'zh' ? '智能复习' : 'Smart Review',
      durationMinutes: 5,
      content: {
        flashcards: dueReviews.slice(0, 10).map(r => ({
          id: r.id,
          front: r.front,
          back: r.back,
          type: 'vocabulary' as const
        }))
      }
    };
    remainingMinutes -= 5;
    focusAreas = focusAreas.filter(f => f !== 'review');
  }

  // Distribute remaining minutes across remaining focus areas
  const areasCount = focusAreas.length
  if (areasCount > 0 && remainingMinutes > 0) {
    // If we have very little time, we assign a minimum of 5 minutes per skill, which might exceed dailyMinutes softly, but guarantees content.
    // E.g. 10 mins remaining, 3 skills -> 5 mins for first two, 0 for third (it gets skipped).
    let timePerArea = Math.max(5, Math.floor(remainingMinutes / areasCount))
    
    if (focusAreas.includes('vocabulary') && remainingMinutes > 0) {
      const mins = Math.min(timePerArea, remainingMinutes)
      const finalVocab = mins > 5 ? vocabScale : Math.ceil(vocabScale / 2)
      tasks.push(`Vocabulary task (${mins} minutes): Generate ${finalVocab} new vocabulary words from themes: ${unit.vocabulary.join(', ')}. Each word: Swedish, ${motherTongue} translation, short example.`)
      remainingMinutes -= mins
    }

    if (focusAreas.includes('grammar') && remainingMinutes > 0) {
      const mins = Math.min(timePerArea, remainingMinutes)
      const grammarPoint = unit.grammar[Math.floor(Math.random() * unit.grammar.length)]
      tasks.push(`Grammar task (${mins} minutes): Teach "${grammarPoint}". Include brief explanation, 1-2 examples, and ${grammarScale + (mins > 5 ? 1 : 0)} exercises.`)
      remainingMinutes -= mins
    }

    if (focusAreas.includes('reading') && remainingMinutes > 0) {
      const mins = Math.min(timePerArea, remainingMinutes)
      const rScale = mins > 5 ? readingScale : Math.floor(readingScale / 2)
      tasks.push(`Reading task (${mins} minutes): Generate a short Swedish text (approx ${rScale} words). Include 1-2 comprehension questions.`)
      remainingMinutes -= mins
    }

    if (focusAreas.includes('writing') && remainingMinutes > 0) {
      const mins = remainingMinutes // give all leftover to writing
      const wScale = intensity === 'extreme' ? unit.wordCountTarget * 2 : unit.wordCountTarget
      tasks.push(`Writing task (${mins} minutes): Create a writing prompt based on "${unit.writing[0]}". Target word count: ${wScale} words.`)
      remainingMinutes = 0
    }

    // If we still somehow have remaining time and review is requested
    if (focusAreas.includes('review') && remainingMinutes > 0) {
      tasks.push(`Review task (${remainingMinutes} minutes): Generate 3-4 flashcards reviewing key vocabulary and grammar from this unit.`)
    }
  }

  const userPrompt = `Generate a daily lesson with these tasks:

${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}


Respond with JSON matching this schema:
{
  "unitId": "${unit.id}",
  "unitTitle": "${locale === 'zh' ? unit.titleZh : unit.titleEn}",
  "estimatedMinutes": ${dailyMinutes},
  "tasks": [
    {
      "type": "vocabulary|grammar|reading|writing|review",
      "title": "Task title in ${motherTongue}",
      "durationMinutes": number,
      "content": { ... task-specific content }
    }
  ]
}

For vocabulary content: { "theme": "...", "words": [{ "swedish": "...", "translation": "...", "example": "..." }] }
For grammar content: { "topic": "...", "explanation": "...", "examples": [{ "swedish": "...", "translation": "..." }], "exercises": [{ "type": "fill_blank|multiple_choice", "question": "...", "options": ["..."], "answer": "...", "hint": "..." }] }
For reading content: { "title": "...", "text": "...", "level": "...", "questions": [{ "question": "...", "options": ["..."], "correctAnswer": 0, "explanation": "..." }] }
For writing content: { "prompt": "...", "instructions": "...", "wordCountTarget": ${unit.wordCountTarget}, "exampleStructure": "...", "evaluationCriteria": ["..."] }
For review content: { "flashcards": [{ "front": "...", "back": "...", "type": "vocabulary|grammar" }] }`

  const lesson = await generateJSON<DailyLesson>({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 10000,
  })

  // Prepend the manually created reliable review task instead of trusting AI
  if (reviewTask) {
    lesson.tasks.unshift(reviewTask)
  }

  return lesson
}
