'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timer, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { prToRelayPace, parseTimeInput } from '@/lib/pace'
import { RaceInfoStep } from '@/components/race-setup/race-info-step'
import { LegsStep, type LegInput } from '@/components/race-setup/legs-step'
import { RunnersStep, type RunnerInput } from '@/components/race-setup/runners-step'
import { AssignmentsStep } from '@/components/race-setup/assignments-step'
import { useRace } from '@/hooks/use-race'
import { useLegs } from '@/hooks/use-legs'
import { useRunners } from '@/hooks/use-runners'

const STEPS = [
  { key: 'info', label: 'Race Info' },
  { key: 'legs', label: 'Legs' },
  { key: 'runners', label: 'Runners' },
  { key: 'assignments', label: 'Assignments' },
] as const

export default function EditRacePage() {
  const router = useRouter()
  const params = useParams()
  const raceId = params.raceId as string

  const { race, loading: raceLoading, refetch: refetchRace } = useRace(raceId)
  const { legs: existingLegs, loading: legsLoading } = useLegs(raceId)
  const { runners: existingRunners, loading: runnersLoading } = useRunners(raceId)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [raceInfo, setRaceInfo] = useState({
    name: '',
    editPin: '',
    confirmPin: '',
    startTime: '',
  })
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({})

  // Step 2
  const [legs, setLegs] = useState<LegInput[]>([])
  const [legsError, setLegsError] = useState('')

  // Step 3
  const [runners, setRunners] = useState<RunnerInput[]>([])
  const [runnersError, setRunnersError] = useState('')

  // Step 4
  const [assignments, setAssignments] = useState<(number | null)[]>([])
  const [assignError, setAssignError] = useState('')

  useEffect(() => {
    if (!race || raceLoading) return
    setRaceInfo({
      name: race.name ?? '',
      editPin: race.edit_pin ?? '',
      confirmPin: race.edit_pin ?? '',
      startTime: race.start_time ? new Date(race.start_time).toISOString().slice(0,16) : '',
    })
  }, [race, raceLoading])

  useEffect(() => {
    if (legsLoading || runnersLoading) return
    // populate legs
    setLegs(existingLegs.map(l => ({ distance: l.distance.toString(), difficulty: l.difficulty as any })))
    // populate runners
    setRunners(existingRunners.map(r => ({ name: r.name, prDistance: r.pr_distance, prTime: '' })))
    // populate assignments by matching runner_id to index
    const runnerIds = existingRunners.map(r => r.id)
    const assigns = existingLegs.map(l => (l.runner_id ? runnerIds.indexOf(l.runner_id) : null))
    setAssignments(assigns)
  }, [existingLegs, existingRunners, legsLoading, runnersLoading])

  function validateStep(stepIndex: number): boolean {
    if (stepIndex === 0) {
      const errors: Record<string, string> = {}
      if (!raceInfo.name.trim()) errors.name = 'Race name is required'
      if (raceInfo.editPin.length < 4) errors.editPin = 'PIN must be 4-6 digits'
      if (raceInfo.editPin !== raceInfo.confirmPin) errors.confirmPin = 'PINs do not match'
      setInfoErrors(errors)
      return Object.keys(errors).length === 0
    }
    if (stepIndex === 1) {
      if (legs.length === 0) {
        setLegsError('Add at least one leg')
        return false
      }
      const invalid = legs.some(l => !l.distance || Number(l.distance) <= 0)
      if (invalid) {
        setLegsError('All legs must have a distance greater than 0')
        return false
      }
      setLegsError('')
      return true
    }
    if (stepIndex === 2) {
      if (runners.length === 0) {
        setRunnersError('Add at least one runner')
        return false
      }
      const missingName = runners.some(r => !r.name.trim())
      if (missingName) {
        setRunnersError('All runners need a name')
        return false
      }
      const missingPR = runners.some(r => {
        if (!r.prTime) return false
        const sec = parseTimeInput(r.prTime)
        return sec === null || sec <= 0
      })
      if (missingPR) {
        setRunnersError('All runners need a valid PR time (MM:SS or HH:MM:SS)')
        return false
      }
      setRunnersError('')
      if (assignments.length !== legs.length) {
        setAssignments(new Array(legs.length).fill(null))
      }
      return true
    }
    if (stepIndex === 3) {
      const unassigned = assignments.filter(a => a === null).length
      if (unassigned > 0) {
        setAssignError(`${unassigned} leg(s) are still unassigned`)
        return false
      }
      setAssignError('')
      return true
    }
    return true
  }

  function nextStep() {
    if (validateStep(step)) setStep(step + 1)
  }
  function prevStep() { setStep(Math.max(0, step - 1)) }

  async function handleSave() {
    if (!race) return
    if (!validateStep(3)) return
    setSaving(true)

    try {
      const supabase = createClient()

      // Update race info
      const { error: raceErr } = await supabase
        .from('races')
        .update({ name: raceInfo.name.trim(), edit_pin: raceInfo.editPin, start_time: raceInfo.startTime ? new Date(raceInfo.startTime).toISOString() : null })
        .eq('id', race.id)
      if (raceErr) throw new Error(raceErr.message)

      // Delete existing runners and legs
      await supabase.from('legs').delete().eq('race_id', race.id)
      await supabase.from('runners').delete().eq('race_id', race.id)

      // Insert runners
      const runnerInserts = runners.map((r, i) => {
        const prSeconds = r.prTime ? parseTimeInput(r.prTime)! : null
        return {
          race_id: race.id,
          name: r.name.trim(),
          pr_distance: r.prDistance,
          pr_time_seconds: prSeconds,
          estimated_pace: prSeconds ? prToRelayPace(r.prDistance, prSeconds) : 0,
          sort_order: i,
        }
      })

      const { data: insertedRunners, error: runnersErr } = await supabase
        .from('runners')
        .insert(runnerInserts)
        .select()
      if (runnersErr || !insertedRunners) throw new Error(runnersErr?.message ?? 'Failed to save runners')

      // Insert legs with assignments
      const legInserts = legs.map((l, i) => ({
        race_id: race.id,
        leg_number: i + 1,
        distance: Number(l.distance),
        difficulty: l.difficulty,
        runner_id: assignments[i] !== null ? insertedRunners[assignments[i]!].id : null,
        status: 'upcoming',
      }))

      const { error: legsErr } = await supabase.from('legs').insert(legInserts)
      if (legsErr) throw new Error(legsErr.message)

      toast.success('Race updated')
      router.push(`/race/${race.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save race')
    } finally {
      setSaving(false)
    }
  }

  if (raceLoading || legsLoading || runnersLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Edit Race</CardTitle>
            </CardHeader>
            <CardContent>
              Loading...
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!race) return null

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/race/${race.id}`)} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Edit Race</h1>
          </div>
        </div>

        <div className="mb-8 flex gap-1">
          {STEPS.map((s, i) => (
            <button key={s.key} onClick={() => { if (i < step) setStep(i) }} className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors ${i === step ? 'bg-primary/10 text-primary' : i < step ? 'text-muted-foreground hover:bg-secondary cursor-pointer' : 'text-muted-foreground/50 cursor-default'}`}>
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${i < step ? 'bg-success text-success-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step].label}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <RaceInfoStep data={raceInfo} onChange={setRaceInfo} errors={infoErrors} />
            )}
            {step === 1 && (
              <LegsStep legs={legs} onChange={setLegs} error={legsError} />
            )}
            {step === 2 && (
              <RunnersStep runners={runners} onChange={setRunners} error={runnersError} />
            )}
            {step === 3 && (
              <AssignmentsStep legs={legs} runners={runners} assignments={assignments} onChange={setAssignments} error={assignError} />
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={step === 0} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep} className="gap-1.5">Next<ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">{saving ? 'Saving...' : 'Save Changes'}<Check className="h-4 w-4" /></Button>
          )}
        </div>
      </div>
    </main>
  )
}
