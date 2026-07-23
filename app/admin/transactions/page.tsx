/**
 * Page transactions/finance admin
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getAdminTransactions } from '@/lib/core/admin/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
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
import { IconLoader2, IconDownload, IconReceipt } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PageHeader } from '@/components/ui/page-header'

export default function AdminTransactionsPage() {
  const {
    data: transactions,
    isLoading,
    isError,
  } = useQuery({
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
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Transactions</CardTitle>
          <Badge variant="outline" className="font-normal">
            {transactions?.length || 0}
          </Badge>
        </CardHeader>
        <CardContent>
          {transactions?.length === 0 ? (
            <EmptyState
              icon={<IconReceipt className="h-7 w-7" />}
              title="Aucune transaction"
              description="Les frais de mise en relation confirmés apparaîtront ici pour le suivi financier V1."
              className="my-2"
            />
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {transactions?.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="space-y-3 rounded-lg border p-4 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {(transaction.amount || 0).toFixed
                            ? transaction.amount.toFixed(2)
                            : transaction.amount || 0}{' '}
                          EUR
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), 'PP', {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      {getTypeBadge(transaction.type)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Statut
                      </span>
                      <Badge
                        variant={
                          transaction.status === 'completed'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
