'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, ChevronDown, ChevronUp, Minus, TrendingUp, Mountain, MountainSnow, TrendingDown } from 'lucide-react'
import { useRunners } from '@/hooks/use-runners'
import { useLegs } from '@/hooks/use-legs'
import { useRace } from '@/hooks/use-race'
import type { Leg, Runner, LegDifficulty } from '@/lib/types'
import { RACE_DISTANCES, FATIGUE_LABELS, DIFFICULTY_OPTIONS } from '@/lib/types'
import { formatPace, formatDuration, secondsToTimeInput } from '@/lib/pace'
import { computeEstimates, type LegEstimate } from '@/lib/estimates'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const DIFFICULTY_ICONS: Record<LegDifficulty, React.ReactNode> = {
  easy: <Minus className="h-3 w-3" />,
  medium: <TrendingUp className="h-3 w-3" />,
  hard: <Mountain className="h-3 w-3" />,
  'extra hard': <MountainSnow className="h-3 w-3" />,
}

const DIFFICULTY_COLORS: Record<LegDifficulty, string> = {
  easy: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  hard: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  'extra hard': 'bg-destructive/20 text-destructive border-destructive/30',
}

function RunnerCard({ runner, runnerLegs, estimates }: {
  runner: Runner
  runnerLegs: Leg[]
  estimates: LegEstimate[]
}) {
  const [open, setOpen] = useState(false)

  const completed = runnerLegs.filter(l => l.status === 'completed')
  const active = runnerLegs.find(l => l.status === 'active')
  const avgPace = completed.length > 0
    ? completed.reduce((sum, l) => sum + (l.actual_pace ?? 0), 0) / completed.length
    : null

  const paceChartData = completed
    .sort((a, b) => a.leg_number - b.leg_number)
    .map(l => ({
      leg: `Leg ${l.leg_number}`,
      pace: l.actual_pace ? Math.round(l.actual_pace * 100) / 100 : null,
    }))
    .filter(d => d.pace !== null)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={active ? 'border-primary/30' : ''}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-mono text-sm font-bold text-muted-foreground">
                  {runner.sort_order + 1}
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {runner.name}
                    {active && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 px-1.5 py-0 h-4">
                        RUNNING
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {RACE_DISTANCES[runner.pr_distance].label} PR: {secondsToTimeInput(runner.pr_time_seconds)}
                    {' '} | Est. {formatPace(runner.estimated_pace)}/mi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{completed.length}/3 legs</p>
                  {avgPace && (
                    <p className="text-xs text-muted-foreground">Avg {formatPace(avgPace)}/mi</p>
                  )}
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4 pt-0">
            {/* Legs detail */}
            <div className="flex flex-col gap-2">
              {runnerLegs.sort((a, b) => a.leg_number - b.leg_number).map(leg => {
                const est = estimates.find(e => e.legId === leg.id)
                const duration = leg.start_time && leg.end_time
                  ? (new Date(leg.end_time).getTime() - new Date(leg.start_time).getTime()) / 1000
                  : 0

                return (
                  <div
                    key={leg.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      leg.status === 'active'
                        ? 'border-primary/30 bg-primary/5'
                        : leg.status === 'completed'
                        ? 'border-success/20 bg-success/5'
                        : 'border-border bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground w-12">
                        Leg {leg.leg_number}
                      </span>
                      <span className="text-sm font-mono">{leg.distance} mi</span>
                      <Badge
                        variant="outline"
                        className={`gap-0.5 text-[10px] px-1.5 py-0 h-4 ${DIFFICULTY_COLORS[leg.difficulty]}`}
                      >
                        {DIFFICULTY_ICONS[leg.difficulty]}
                        {DIFFICULTY_OPTIONS.find(o => o.value === leg.difficulty)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      {leg.status === 'completed' && (
                        <>
                          <div>
                            <p className="font-mono text-sm">{formatDuration(duration)}</p>
                            <p className="text-xs text-muted-foreground">
                              {leg.actual_pace ? `${formatPace(leg.actual_pace)}/mi` : ''}
                            </p>
                          </div>
                          {leg.fatigue_level && (
                            <Badge variant="outline" className="text-[10px] h-5">
                              {FATIGUE_LABELS[leg.fatigue_level]}
                            </Badge>
                          )}
                        </>
                      )}
                      {leg.status === 'active' && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">Active</Badge>
                      )}
                      {leg.status === 'upcoming' && est && (
                        <p className="text-xs text-muted-foreground">
                          ETA: {est.estimatedStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pace chart */}
            {paceChartData.length >= 2 && (
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Pace Trend</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={paceChartData}>
                    <XAxis
                      dataKey="leg"
                      tick={{ fontSize: 11, fill: 'oklch(0.65 0.01 260)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'oklch(0.65 0.01 260)' }}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(v: number) => formatPace(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.005 260)',
                        border: '1px solid oklch(0.26 0.005 260)',
                        borderRadius: '6px',
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${formatPace(v)}/mi`, 'Pace']}
                    />
                    <Line
                      type="monotone"
                      dataKey="pace"
                      stroke="oklch(0.75 0.16 55)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'oklch(0.75 0.16 55)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export default function RunnersPage() {
  const params = useParams()
  const router = useRouter()
  const raceId = params.raceId as string

  const { race, loading: raceLoading } = useRace(raceId)
  const { runners, loading: runnersLoading } = useRunners(raceId)
  const { legs, loading: legsLoading } = useLegs(raceId)

  const loading = raceLoading || runnersLoading || legsLoading

  const estimates = useMemo(() => {
    if (!race?.start_time) return []
    return computeEstimates(legs, runners, new Date(race.start_time))
  }, [legs, runners, race?.start_time])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-8">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-6">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/race/${raceId}`)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Runner Details</h1>
          <span className="text-sm text-muted-foreground">({runners.length} runners)</span>
        </div>

        <div className="flex flex-col gap-3">
          {runners.map(runner => {
            const runnerLegs = legs.filter(l => l.runner_id === runner.id)
            return (
              <RunnerCard
                key={runner.id}
                runner={runner}
                runnerLegs={runnerLegs}
                estimates={estimates}
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}
