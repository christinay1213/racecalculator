import { type RaceDistance, type LegDifficulty, type Leg, type Runner, RACE_DISTANCES } from './types'

// --- PR to Relay Pace Conversion ---

const RELAY_ADJUSTMENT: Record<RaceDistance, number> = {
  '5k': 1.12,
  '10k': 1.10,
  half: 1.05,
  marathon: 1.00,
}

/**
 * Convert a PR time to an estimated relay pace (min/mile).
 * Uses the Riegel formula to normalize across distances.
 */
export function prToRelayPace(prDistance: RaceDistance, prTimeSeconds: number): number {
  const distanceMiles = RACE_DISTANCES[prDistance].miles
  const racePaceMinPerMile = prTimeSeconds / 60 / distanceMiles
  const adjustment = RELAY_ADJUSTMENT[prDistance]
  return racePaceMinPerMile * adjustment
}

// --- Terrain Difficulty Multipliers ---

const TERRAIN_MULTIPLIER: Record<LegDifficulty, number> = {
  easy: 0.95,
  medium: 1.00,
  hard: 1.10,
  'extra hard': 1.18,
}

export function getTerrainMultiplier(difficulty: LegDifficulty): number {
  return TERRAIN_MULTIPLIER[difficulty] ?? 1.0
}

// --- Fatigue Multipliers ---

const FATIGUE_MULTIPLIER: Record<number, number> = {
  1: 1.00,
  2: 1.03,
  3: 1.07,
  4: 1.12,
  5: 1.20,
}

export function getFatigueMultiplier(fatigueLevel: number): number {
  return FATIGUE_MULTIPLIER[Math.min(Math.max(fatigueLevel, 1), 5)] ?? 1.07
}

// --- System-Suggested Fatigue ---

/**
 * Suggest a fatigue level based on which of the runner's 3 legs this is,
 * and the time of day.
 */
export function suggestFatigue(
  runnerLegIndex: number,  // 0, 1, or 2 (which of the runner's 3 legs)
  timeOfDay?: Date
): number {
  let baseFatigue: number
  if (runnerLegIndex === 0) baseFatigue = 1
  else if (runnerLegIndex === 1) baseFatigue = 3
  else baseFatigue = 4

  // Night penalty (10pm - 5am)
  if (timeOfDay) {
    const hour = timeOfDay.getHours()
    if (hour >= 22 || hour < 5) {
      baseFatigue = Math.min(baseFatigue + 1, 5)
    }
  }

  return baseFatigue
}

// --- Pace Prediction ---

/**
 * Predict the pace for a runner's upcoming leg.
 * Takes into account previous actual paces, terrain, and fatigue.
 */
export function predictPace(
  runner: Runner,
  targetLeg: Leg,
  allLegs: Leg[],
): number {
  // Find this runner's completed legs (in order)
  const completedLegs = allLegs
    .filter(l => l.runner_id === runner.id && l.status === 'completed' && l.actual_pace != null)
    .sort((a, b) => a.leg_number - b.leg_number)

  const terrainMult = getTerrainMultiplier(targetLeg.difficulty)

  if (completedLegs.length === 0) {
    // No data yet: use estimated pace from PR + terrain adjustment
    return runner.estimated_pace * terrainMult
  }

  // Normalize completed paces to remove terrain effects
  const normalizedPaces = completedLegs.map(leg => {
    const legTerrainMult = getTerrainMultiplier(leg.difficulty)
    return (leg.actual_pace ?? runner.estimated_pace) / legTerrainMult
  })

  // Weighted average: more recent legs weighted higher
  let basePace: number
  if (normalizedPaces.length === 1) {
    basePace = normalizedPaces[0]
  } else {
    // Weight: 40% first leg, 60% second leg
    basePace = normalizedPaces[0] * 0.4 + normalizedPaces[1] * 0.6
  }

  // Apply terrain for target leg
  let predicted = basePace * terrainMult

  // Apply fatigue
  const fatigueLevel = targetLeg.fatigue_level ??
    targetLeg.system_suggested_fatigue ??
    suggestFatigue(completedLegs.length)
  predicted *= getFatigueMultiplier(fatigueLevel)

  return predicted
}

// --- Formatting Utilities ---

export function formatPace(paceMinPerMile: number): string {
  const minutes = Math.floor(paceMinPerMile)
  const seconds = Math.round((paceMinPerMile - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.round(totalSeconds % 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function parseTimeInput(input: string): number | null {
  const parts = input.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return null
}

export function secondsToTimeInput(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
