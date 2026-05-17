/**
 * Page transactions/finance admin
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getAdminTransactions } from '@/lib/core/admin/actions'
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
import { PageHeader } from '@/components/ui/page-header'

export default function AdminTransactionsPage() {
  const { data: transactions, isLoading, isError } = useQuery({
    queryKey: ['adminTransactions'],
    retry: 1,
    queryFn: getAdminTransactions,
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

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-destructive">
        Erreur lors du chargement des transactions. Veuillez recharger la page.
      </div>
    )
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      payment: 'default',
      refund: 'destructive',
    }
    return <Badge variant={variants[type] || 'secondary'}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions & Finance"
        description="Vue d'ensemble des transactions financières"
        breadcrumbs={[
          { label: 'Dashboard Admin', href: '/admin/dashboard' },
          { label: 'Finance' },
        ]}
        actions={
          <Button onClick={handleExportCSV}>
            <IconDownload className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        }
      />

      {/* Métriques */}
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
