import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request, { params }: { params: { raceId: string } }) {
  try {
    const { pin } = await req.json()
    const raceId = params.raceId

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from('races')
      .select('id, status, edit_pin')
      .eq('id', raceId)
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    if (data.status !== 'setup') {
      return NextResponse.json({ error: 'Race is not editable' }, { status: 400 })
    }

    if (data.edit_pin !== pin) {
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
    }

    // Set a short-lived HTTP-only cookie to indicate this client may edit this race
    const res = NextResponse.json({ success: true })
    const cookieName = `race_edit_${raceId}`
    // 12 hours
    res.cookies.set(cookieName, '1', { httpOnly: true, path: '/', maxAge: 60 * 60 * 12 })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
