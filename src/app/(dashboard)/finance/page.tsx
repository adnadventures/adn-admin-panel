import { PageHeader } from "@/components/shared/page-header";
import { requireModule } from "@/lib/auth/session";
import { listExpenses } from "@/lib/data/expenses";
import { listInvoices } from "@/lib/data/invoices";
import { todayIST } from "@/lib/format";
import { FinanceDashboard } from "./finance-dashboard";

export default async function Page() {
  await requireModule("finance");
  const [invoices, allExpenses] = await Promise.all([
    listInvoices(),
    listExpenses(),
  ]);
  const reportInvoices = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    customer: invoice.customer.name,
    issueDate: invoice.issueDate,
    currency: invoice.currency,
    status: invoice.status,
    amountPaid: invoice.amountPaid,
    remainingBalance: invoice.remainingBalance,
    packageCost: invoice.package.cost?.amount ?? 0,
  }));
  const toReportExpense = (expense: (typeof allExpenses)[number]) => ({
    id: expense.id,
    date: expense.date,
    description: expense.description,
    category: expense.category,
    payee: expense.payee || expense.vendor,
    currency: expense.money.currency,
    amount: expense.money.amount,
  });
  const bookingExpenses = allExpenses
    .filter((expense) => Boolean(expense.bookingId))
    .map(toReportExpense);
  const companyExpenses = allExpenses
    .filter((expense) => !expense.bookingId)
    .map(toReportExpense);

  return (
    <>
      <PageHeader title="Finance" description="Review paid invoice amounts, pending collections, expenses, and profit over a selected period." />
      <FinanceDashboard
        invoices={reportInvoices}
        bookingExpenses={bookingExpenses}
        companyExpenses={companyExpenses}
        today={todayIST()}
      />
    </>
  );
}
