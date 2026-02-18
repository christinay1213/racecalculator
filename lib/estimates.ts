import { type Leg, type Runner } from './types'
import { predictPace } from './pace'

export type LegEstimate = {
  legNumber: number
  legId: string
  runnerId: string | null
  runnerName: string
  distance: number
  predictedPace: number
  estimatedDuration: number  // seconds
  estimatedStart: Date
  estimatedEnd: Date
}

/**
 * Generate time estimates for all upcoming legs.
 * Chains forward from the current active leg or race start time.
 */
export function computeEstimates(
  legs: Leg[],
  runners: Runner[],
  raceStartTime: Date | null,
): LegEstimate[] {
  if (!raceStartTime) return []

  const sorted = [...legs].sort((a, b) => a.leg_number - b.leg_number)
  const runnerMap = new Map(runners.map(r => [r.id, r]))

  const estimates: LegEstimate[] = []
  let currentTime = new Date(raceStartTime)

  for (const leg of sorted) {
    if (leg.status === 'completed' && leg.end_time) {
      currentTime = new Date(leg.end_time)
      continue
    }

    if (leg.status === 'active' && leg.start_time) {
      currentTime = new Date(leg.start_time)
    }

    const runner = leg.runner_id ? runnerMap.get(leg.runner_id) : null
    const pace = runner ? predictPace(runner, leg, sorted) : 10 // default 10 min/mile
    const duration = pace * leg.distance * 60 // seconds

    const estimatedStart = new Date(currentTime)
    const estimatedEnd = new Date(currentTime.getTime() + duration * 1000)

    estimates.push({
      legNumber: leg.leg_number,
      legId: leg.id,
      runnerId: leg.runner_id,
      runnerName: runner?.name ?? 'Unassigned',
      distance: leg.distance,
      predictedPace: pace,
      estimatedDuration: duration,
      estimatedStart,
      estimatedEnd,
    })

    currentTime = estimatedEnd
  }

  return estimates
}

/**
 * Get the overall estimated finish time from estimates.
 */
export function getEstimatedFinish(estimates: LegEstimate[]): Date | null {
  if (estimates.length === 0) return null
  return estimates[estimates.length - 1].estimatedEnd
}

/**
 * Get total race distance from legs.
 */
export function getTotalDistance(legs: Leg[]): number {
  return legs.reduce((sum, leg) => sum + leg.distance, 0)
}

/**
 * Get completed distance.
 */
export function getCompletedDistance(legs: Leg[]): number {
  return legs
    .filter(l => l.status === 'completed')
    .reduce((sum, leg) => sum + leg.distance, 0)
}
