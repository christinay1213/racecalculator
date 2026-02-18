'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, Users } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRace } from '@/hooks/use-race'
import { useLegs } from '@/hooks/use-legs'
import { useRunners } from '@/hooks/use-runners'
import { usePin } from '@/hooks/use-pin'
import { computeEstimates } from '@/lib/estimates'
import { suggestFatigue } from '@/lib/pace'
import { DashboardHeader } from '@/components/race-dashboard/dashboard-header'
import { CurrentLegCard } from '@/components/race-dashboard/current-leg-card'
import { UpcomingLegs } from '@/components/race-dashboard/upcoming-legs'
import { CompletedLegsTable } from '@/components/race-dashboard/completed-legs-table'
import { RunnerSummary } from '@/components/race-dashboard/runner-summary'
import { PinDialog } from '@/components/pin-dialog'
import { ShareDialog } from '@/components/share-dialog'
import { CompleteLegDialog } from '@/components/complete-leg-dialog'
import Link from 'next/link'

export default function RaceDashboard() {
  const params = useParams()
  const raceId = params.raceId as string

  const { race, loading: raceLoading } = useRace(raceId)
  const { legs, loading: legsLoading, refetch: refetchLegs } = useLegs(raceId)
  const { runners, loading: runnersLoading } = useRunners(raceId)
  const { isUnlocked, unlock } = usePin(raceId)

  const [pinOpen, setPinOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loading = raceLoading || legsLoading || runnersLoading

  // Current active leg
  const activeLeg = useMemo(
    () => legs.find(l => l.status === 'active') ?? null,
    [legs]
  )

  // Runner for active leg
  const activeRunner = useMemo(
    () => (activeLeg?.runner_id ? runners.find(r => r.id === activeLeg.runner_id) ?? null : null),
    [activeLeg, runners]
  )

  // How many legs this runner has completed before this one
  const runnerLegIndex = useMemo(() => {
    if (!activeRunner) return 0
    return legs.filter(
      l => l.runner_id === activeRunner.id && l.status === 'completed'
    ).length
  }, [activeRunner, legs])

  // Estimates
  const estimates = useMemo(() => {
    if (!race?.start_time) return []
    return computeEstimates(legs, runners, new Date(race.start_time))
  }, [legs, runners, race?.start_time])

  async function handlePinSubmit(pin: string): Promise<boolean> {
    if (!race) return false
    return await unlock(pin)
  }

  async function handleStartRace() {
    if (!race || !isUnlocked) return
    setSaving(true)
    try {
      const res = await fetch(`/api/race/${raceId}/start`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start')
      toast.success('Race started!')
    } catch {
      toast.error('Failed to start race')
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteLeg(fatigueLevel: number) {
    if (!activeLeg || !activeRunner) return
    setSaving(true)
    try {
      const res = await fetch(`/api/race/${raceId}/complete-leg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legId: activeLeg.id, fatigueLevel }),
      })
      if (!res.ok) throw new Error('Failed to complete')
      setCompleteOpen(false)
      refetchLegs()
      toast.success(`Leg ${activeLeg.leg_number} completed!`)
    } catch {
      toast.error('Failed to complete leg')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-8">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    )
  }

  if (!race) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center flex flex-col gap-3">
          <p className="text-xl font-semibold">Race not found</p>
          <p className="text-muted-foreground">Check the link and try again.</p>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-6">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <DashboardHeader
          race={race}
          legs={legs}
          estimates={estimates}
          isUnlocked={isUnlocked}
          onShareClick={() => setShareOpen(true)}
          onPinClick={() => {
            if (!isUnlocked) setPinOpen(true)
          }}
          onEditClick={() => {
            if (isUnlocked) router.push(`/race/${raceId}/edit`)
            else setPinOpen(true)
          }}
        />

        <CurrentLegCard
          leg={activeLeg}
          runner={activeRunner}
          legs={legs}
          isUnlocked={isUnlocked}
          onComplete={() => setCompleteOpen(true)}
          raceStatus={race.status}
        />

        {/* Start Race button (setup mode) */}
        {race.status === 'setup' && isUnlocked && (
          <Button
            size="lg"
            onClick={handleStartRace}
            disabled={saving || legs.length === 0}
            className="w-full gap-2"
          >
            <Play className="h-5 w-5" />
            {saving ? 'Starting...' : 'Start Race'}
          </Button>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <UpcomingLegs legs={legs} estimates={estimates} />
            <CompletedLegsTable legs={legs} runners={runners} />
          </div>
          <div className="flex flex-col gap-6">
            <RunnerSummary runners={runners} legs={legs} estimates={estimates} />
            <Link href={`/race/${raceId}/runners`}>
              <Button variant="outline" className="w-full gap-2">
                <Users className="h-4 w-4" />
                Runner Details
              </Button>
            </Link>
          </div>
        </div>

        {/* Dialogs */}
        <PinDialog
          open={pinOpen}
          onOpenChange={setPinOpen}
          onSubmit={handlePinSubmit}
        />
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          raceId={raceId}
          editPin={race.edit_pin}
        />
        <CompleteLegDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          leg={activeLeg}
          runner={activeRunner}
          runnerLegIndex={runnerLegIndex}
          onComplete={handleCompleteLeg}
          saving={saving}
        />
      </div>
    </main>
  )
}
