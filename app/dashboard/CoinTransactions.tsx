"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CoinTransactions() {
  // This would typically fetch data from your API or blockchain
  const transactions = [
    { type: "Buy", coin: "AVAX", amount: 100, price: 20, pnl: 5 },
    { type: "Sell", coin: "ETH", amount: 2, price: 1800, pnl: -10 },
    { type: "Buy", coin: "BTC", amount: 0.5, price: 30000, pnl: 100 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Transactions</CardTitle>
        <CardDescription>Recent buys and sells with PnL</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Coin</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>PnL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TableRow key={index}>
                <TableCell>{tx.type}</TableCell>
                <TableCell>{tx.coin}</TableCell>
                <TableCell>{tx.amount}</TableCell>
                <TableCell>${tx.price}</TableCell>
                <TableCell
                  className={tx.pnl >= 0 ? "text-green-600" : "text-red-600"}
                >
                  ${tx.pnl}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
