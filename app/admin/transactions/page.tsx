/**
 * Page transactions/finance admin
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/shared/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconLoader2, IconDownload } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminTransactionsPage() {
  const supabase = createClient()

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
  })

  const totalRevenue =
    transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0

  const handleExportCSV = () => {
    // TODO: Implémenter export CSV
    alert('Export CSV à implémenter')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      payment: 'default',
      refund: 'destructive',
      commission: 'secondary',
    }
    return <Badge variant={variants[type] || 'secondary'}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions & Finance</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des transactions financières
          </p>
        </div>
        <Button onClick={handleExportCSV}>
          <IconDownload className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Métriques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toFixed(2)} EUR
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Taux de litige
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction: any) => (
                <TableRow key={transaction.id}>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell>{transaction.amount || 0} EUR</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === 'completed'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.created_at), 'PP', {
                      locale: fr,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
