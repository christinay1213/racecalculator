'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Timer, Plus, ArrowRight, Zap, Users, Mountain } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [raceCode, setRaceCode] = useState('')
  const [joinError, setJoinError] = useState('')

  function handleJoin() {
    const trimmed = raceCode.trim()
    if (!trimmed) {
      setJoinError('Enter a race ID or link')
      return
    }
    // Handle full URL or just the ID
    const match = trimmed.match(/race\/([a-f0-9-]+)/i)
    const id = match ? match[1] : trimmed
    router.push(`/race/${id}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-4 py-16">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Timer className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance">Relay Tracker</h1>
        </div>
        <p className="max-w-lg text-lg text-muted-foreground text-pretty leading-relaxed">
          Real-time race tracking for your team. Predict paces, estimate handoff times, and keep everyone in sync across all 200 miles.
        </p>
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>Live pace predictions</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          <span>12 runners, real-time sync</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
          <Mountain className="h-4 w-4 text-primary" />
          <span>Terrain-adjusted ETAs</span>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
        {/* Create Race */}
        <Card className="group cursor-pointer transition-colors hover:border-primary/50" onClick={() => router.push('/race/create')}>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Create a Race</CardTitle>
            <CardDescription className="leading-relaxed">
              Set up your legs, add runners with their PRs, and get a shareable link for your whole team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground" variant="secondary">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Join Race */}
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Join a Race</CardTitle>
            <CardDescription className="leading-relaxed">
              Paste your race link or ID to view the live dashboard and track your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="raceCode" className="sr-only">Race ID or Link</Label>
                <Input
                  id="raceCode"
                  placeholder="Paste race link or ID..."
                  value={raceCode}
                  onChange={(e) => {
                    setRaceCode(e.target.value)
                    setJoinError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="bg-secondary"
                />
                {joinError && <p className="text-sm text-destructive">{joinError}</p>}
              </div>
              <Button onClick={handleJoin} variant="secondary" className="w-full gap-2">
                Join Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
