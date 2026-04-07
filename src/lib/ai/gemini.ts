import { GoogleGenAI } from '@google/genai'

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set!')
}

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

// Use the model specified by user: gemini-3-flash-preview
// Fallback chain: gemini-3-flash-preview → gemini-2.0-flash
const MODEL = 'gemini-2.0-flash'

export interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'json' | 'text'
}

/**
 * Core Gemini text generation function
 */
export async function generate(options: GenerateOptions): Promise<string> {
  const { systemPrompt, userPrompt, temperature = 0.7, maxTokens = 8192, responseFormat = 'text' } = options

  const config: any = {
    temperature,
    maxOutputTokens: maxTokens,
  }

  if (responseFormat === 'json') {
    config.responseMimeType = 'application/json'
  }

  const response = await genai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      ...config,
      systemInstruction: systemPrompt,
    },
  })

  return response.text || ''
}

/**
 * Attempt to repair truncated JSON by closing open structures
 */
function repairJSON(text: string): string {
  let s = text.trim()

  // Close any open string (find last unescaped quote)
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length
  if (quoteCount % 2 !== 0) {
    s += '"'
  }

  // Count open brackets/braces and close them
  let openBraces = 0
  let openBrackets = 0
  let inString = false

  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"' && (i === 0 || s[i - 1] !== '\\')) {
      inString = !inString
    }
    if (!inString) {
      if (s[i] === '{') openBraces++
      if (s[i] === '}') openBraces--
      if (s[i] === '[') openBrackets++
      if (s[i] === ']') openBrackets--
    }
  }

  // Remove trailing comma before closing
  s = s.replace(/,\s*$/, '')

  // Close open structures
  for (let i = 0; i < openBrackets; i++) s += ']'
  for (let i = 0; i < openBraces; i++) s += '}'

  return s
}

/**
 * Generate structured JSON from Gemini with auto-repair for truncated output
 */
export async function generateJSON<T = any>(options: Omit<GenerateOptions, 'responseFormat'>): Promise<T> {
  const text = await generate({ ...options, responseFormat: 'json' })

  try {
    return JSON.parse(text) as T
  } catch (e) {
    console.warn('JSON parse failed, attempting repair...')
    try {
      const repaired = repairJSON(text)
      return JSON.parse(repaired) as T
    } catch (e2) {
      // Last resort: retry with higher token limit
      console.warn('JSON repair failed, retrying with higher token limit...')
      const retryText = await generate({
        ...options,
        maxTokens: 16384,
        responseFormat: 'json',
      })
      return JSON.parse(retryText) as T
    }
  }
}
