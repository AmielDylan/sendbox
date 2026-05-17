'use client'

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type WeeklyEntry = { week: string; count: number }
type DailyEntry = { day: string; volume: number }

interface AdminChartsSectionProps {
  weeklyRegistrations: WeeklyEntry[]
  dailyTransactions: DailyEntry[]
}

export function AdminChartsSection({
  weeklyRegistrations,
  dailyTransactions,
}: AdminChartsSectionProps) {
  const weeklyData = weeklyRegistrations.map(d => ({
    ...d,
    label: format(parseISO(d.week), 'd MMM', { locale: fr }),
  }))

  const dailyData = dailyTransactions.map(d => ({
    ...d,
    label: format(parseISO(d.day), 'd MMM', { locale: fr }),
    volumeEur: Math.round(d.volume * 100) / 100,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Inscriptions par semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune donnée disponible
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={weeklyData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Inscriptions']}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Volume transactions — 30 derniers jours (EUR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune donnée disponible
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={dailyData}
                margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="volumeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)} €`,
                    'Volume',
                  ]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volumeEur"
                  stroke="hsl(var(--primary))"
                  fill="url(#volumeGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
