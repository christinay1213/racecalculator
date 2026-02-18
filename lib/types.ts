export type RaceDistance = '5k' | '10k' | 'half' | 'marathon'
export type RaceStatus = 'setup' | 'active' | 'finished'
export type LegStatus = 'upcoming' | 'active' | 'completed'
export type LegDifficulty = 'easy' | 'medium' | 'hard' | 'extra hard'

export type Race = {
  id: string
  name: string
  edit_pin: string
  start_time: string | null
  status: RaceStatus
  current_leg_index: number
  created_at: string
}

export type Runner = {
  id: string
  race_id: string
  name: string
  pr_distance: RaceDistance
  pr_time_seconds: number
  estimated_pace: number
  sort_order: number
}

export type Leg = {
  id: string
  race_id: string
  leg_number: number
  distance: number
  difficulty: LegDifficulty
  runner_id: string | null
  status: LegStatus
  start_time: string | null
  end_time: string | null
  actual_pace: number | null
  fatigue_level: number | null
  system_suggested_fatigue: number | null
}

export const RACE_DISTANCES: Record<RaceDistance, { label: string; miles: number }> = {
  '5k': { label: '5K', miles: 3.10686 },
  '10k': { label: '10K', miles: 6.21371 },
  half: { label: 'Half Marathon', miles: 13.1094 },
  marathon: { label: 'Marathon', miles: 26.2188 },
}

export const DIFFICULTY_OPTIONS: { value: LegDifficulty; label: string; icon: string }[] = [
  { value: 'easy', label: 'Easy', icon: 'Minus' },
  { value: 'medium', label: 'Medium', icon: 'TrendingUp' },
  { value: 'hard', label: 'Hard', icon: 'Mountain' },
  { value: 'extra hard', label: 'Extra Hard', icon: 'MountainSnow' },
]

export const FATIGUE_LABELS: Record<number, string> = {
  1: 'Fresh',
  2: 'Good',
  3: 'Moderate',
  4: 'Tired',
  5: 'Exhausted',
}
