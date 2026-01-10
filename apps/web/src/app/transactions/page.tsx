'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchTransactions } from '@/lib/api';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError(null);
        const response = await fetchTransactions({
          page,
          pageSize,
          q: search || undefined,
        });
        if (active) {
          setTransactions(response.data);
          setTotal(response.total);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load transactions');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [page, pageSize, search]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Transactions</h3>
        <p className="mt-1 text-sm text-slate-500">
          Recent payment events flowing through the scoring pipeline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Filter by card ID or merchant.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search card or merchant"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription>
            {loading ? 'Loading transactions…' : `${total} transactions in view`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-rose-600">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-sm text-slate-500">No transactions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Occurred</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="text-sm font-semibold text-slate-900">
                        {transaction.cardId}
                      </div>
                      <div className="text-xs text-slate-500">{transaction.cardCountry}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">
                        {transaction.merchant.name}
                      </div>
                      <div className="text-xs text-slate-500">{transaction.merchant.category}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-slate-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: transaction.currency,
                        }).format(transaction.amount)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{transaction.channel}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(transaction.occurredAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
