import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request, { params }: { params: { raceId: string } }) {
  const raceId = params.raceId
  try {
    const cookie = req.headers.get('cookie') || ''
    const cookieName = `race_edit_${raceId}`
    if (!cookie.includes(`${cookieName}=1`)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date().toISOString()

    // Ensure race is in setup
    const { data: race, error: raceErr } = await supabase
      .from('races')
      .select('id, status')
      .eq('id', raceId)
      .limit(1)
      .single()

    if (raceErr || !race) return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    if (race.status !== 'setup') return NextResponse.json({ error: 'Race not editable' }, { status: 400 })

    // Update race
    await supabase
      .from('races')
      .update({ status: 'active', start_time: now, current_leg_index: 0 })
      .eq('id', raceId)

    // Set first leg active
    const { data: legs } = await supabase
      .from('legs')
      .select('id, leg_number')
      .eq('race_id', raceId)
      .order('leg_number', { ascending: true })
      .limit(1)

    if (legs && legs.length > 0) {
      await supabase
        .from('legs')
        .update({ status: 'active', start_time: now })
        .eq('id', legs[0].id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
