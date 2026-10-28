import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { listExpenses } from "@/lib/data/expenses";
import { listInvoices } from "@/lib/data/invoices";
import { todayIST } from "@/lib/format";
import { FinanceDashboard } from "./finance-dashboard";

export default async function Page() {
  await requireUser(["admin", "manager"]);
  const [allInvoices, allExpenses] = await Promise.all([listInvoices(), listExpenses()]);
  const invoices = allInvoices.map((invoice) => ({
    issueDate: invoice.issueDate,
    currency: invoice.currency,
    total: invoice.total,
    remainingBalance: invoice.remainingBalance,
    status: invoice.status,
    payments: (invoice.payments ?? []).map(({ amount, date }) => ({ amount, date })),
    package: {
      name: invoice.package.name ?? "",
      destination: invoice.package.destination,
      cost: invoice.package.cost
        ? { currency: invoice.package.cost.currency, amount: invoice.package.cost.amount }
        : null,
    },
  }));
  const expenses = allExpenses.map((expense) => ({
    id: expense.id,
    date: expense.date,
    description: expense.description,
    category: expense.category,
    vendor: expense.vendor,
    amount: expense.money.amount,
    currency: expense.money.currency,
    note: expense.note,
    receipt: expense.receipt
      ? { name: expense.receipt.name, contentType: expense.receipt.contentType }
      : null,
  }));

  return (
    <>
      <PageHeader title="Finance" description="Track invoice sales, payments, package profitability, and operating expenses." />
      <FinanceDashboard invoices={invoices} expenses={expenses} today={todayIST()} />
    </>
  );
}
