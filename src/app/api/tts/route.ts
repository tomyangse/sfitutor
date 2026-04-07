import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || text.length > 500) {
      return NextResponse.json(
        { error: 'Invalid text (max 500 chars)' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS API key not configured' },
        { status: 500 }
      )
    }

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'sv-SE',
            name: 'sv-SE-Wavenet-A', // High-quality female Swedish voice
            ssmlGender: 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.9,  // Slightly slower for learners
            pitch: 0,
          },
        }),
      }
    )

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text()
      console.error('Google TTS error:', err)
      return NextResponse.json(
        { error: 'TTS synthesis failed' },
        { status: 502 }
      )
    }

    const data = await ttsResponse.json()
    // Google returns base64-encoded audio in data.audioContent
    const audioBuffer = Buffer.from(data.audioContent, 'base64')

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // Cache 24h — same text = same audio
      },
    })
  } catch (error: any) {
    console.error('TTS route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
