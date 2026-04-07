import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sm2Review } from '@/lib/sm2'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, front, quality } = await request.json()

    if (quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json({ error: 'Valid quality numeric score required (0-5)' }, { status: 400 })
    }

    let card;
    if (id) {
      const { data } = await supabase.from('flashcards').select('*').eq('id', id).eq('user_id', user.id).single()
      card = data
    } else if (front) {
      const { data } = await supabase.from('flashcards').select('*').eq('front', front).eq('user_id', user.id).single()
      card = data
    }

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const nextState = sm2Review(quality, {
      easiness_factor: card.easiness_factor,
      interval: card.interval,
      repetitions: card.repetitions,
    })

    const { error } = await supabase
      .from('flashcards')
      .update({
        easiness_factor: nextState.easiness_factor,
        interval: nextState.interval,
        repetitions: nextState.repetitions,
        next_review: nextState.next_review.toISOString().split('T')[0]
      })
      .eq('id', card.id)

    if (error) throw error

    // Log the review action in history
    await supabase.from('flashcard_reviews').insert({
      card_id: card.id,
      user_id: user.id,
      quality: quality
    })

    return NextResponse.json({ success: true, nextState })

  } catch (error: any) {
    console.error('Review card error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
