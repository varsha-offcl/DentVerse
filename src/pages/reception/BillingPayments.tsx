import * as React from "react";
import {
  Receipt,
  Check,
  Plus,
  Printer,
  Send,
  CheckCircle2,
  MessageCircle,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";
import { useAppState, type InvoiceWithPatient } from "@/context/AppStateContext";
import type { Invoice } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type BillingRow = InvoiceWithPatient;

const STATUS_FILTERS = ["All", "Paid", "Pending", "Partially Paid", "Overdue"] as const;

function statusBadgeVariant(status: Invoice["status"]) {
  switch (status) {
    case "Paid":
      return "success" as const;
    case "Pending":
    case "Partially Paid":
      return "warning" as const;
    default:
      return "destructive" as const;
  }
}

export default function BillingPayments() {
  const { patients, invoices, addInvoice, markInvoicePaid, profile } = useAppState();

  const rows: BillingRow[] = invoices;

  const [filter, setFilter] = React.useState<(typeof STATUS_FILTERS)[number]>("All");
  const [receiptRow, setReceiptRow] = React.useState<BillingRow | null>(null);
  const [whatsappSent, setWhatsappSent] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newPatientId, setNewPatientId] = React.useState(patients[0]?.id ?? "");
  const [newDescription, setNewDescription] = React.useState("");
  const [newAmount, setNewAmount] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [payingId, setPayingId] = React.useState<string | null>(null);
  const [payError, setPayError] = React.useState<string | null>(null);

  const filtered = rows
    .filter((r) => filter === "All" || r.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalBilled = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalCollected = rows.reduce((sum, r) => {
    if (r.status === "Paid") return sum + r.amount;
    if (r.status === "Partially Paid") return sum + (r.amountPaid ?? 0);
    return sum;
  }, 0);
  const totalOutstanding = totalBilled - totalCollected;
  const pendingCount = rows.filter((r) => r.status !== "Paid").length;

  const openReceipt = (row: BillingRow) => {
    setWhatsappSent(false);
    setReceiptRow(row);
  };

  const handleCreateInvoice = async () => {
    if (!newPatientId || !newDescription.trim() || !newAmount) return;
    setSaving(true);
    setFormError(null);
    try {
      await addInvoice(newPatientId, {
        description: newDescription.trim(),
        amount: parseFloat(newAmount) || 0,
      });
      setCreateOpen(false);
      setNewDescription("");
      setNewAmount("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create this invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (row: BillingRow) => {
    setPayingId(row.id);
    setPayError(null);
    try {
      await markInvoicePaid(row.patientId, row.id);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Could not mark this invoice as paid.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing &amp; Payments</h1>
          <p className="text-sm text-muted-foreground">Administrative payment tracking only — no clinical information.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Generate Invoice
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p className="mt-1 text-xl font-bold">₹{totalBilled.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="mt-1 text-xl font-bold text-success">₹{totalCollected.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={cn("mt-1 text-xl font-bold", totalOutstanding > 0 ? "text-destructive" : "text-success")}>
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unpaid Invoices</p>
            <p className="mt-1 text-xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {payError && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {payError}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((row) => (
          <Card key={`${row.patientId}-${row.id}`}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-secondary text-primary">{row.avatarInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{row.patientName}</p>
                  <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{row.description}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.date} · ₹{row.amount.toLocaleString("en-IN")}
                  {row.status === "Partially Paid" && row.amountPaid !== undefined && (
                    <> · ₹{row.amountPaid.toLocaleString("en-IN")} paid so far</>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {row.status !== "Paid" && (
                  <Button size="sm" variant="success" disabled={payingId === row.id} onClick={() => handleMarkPaid(row)}>
                    <Check className="h-3.5 w-3.5" /> {payingId === row.id ? "Updating..." : "Mark as Paid"}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openReceipt(row)}>
                  <Receipt className="h-3.5 w-3.5" /> Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">No invoices in this view.</p>
        )}
      </div>

      {/* Generate Invoice dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>Create a new administrative charge for a patient.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <Select value={newPatientId} onValueChange={setNewPatientId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="e.g. Consultation Fee" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="1500" />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={!newPatientId || !newDescription.trim() || !newAmount || saving}>
              <Plus className="h-4 w-4" /> {saving ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={!!receiptRow} onOpenChange={(open) => !open && setReceiptRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="no-print">
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          {receiptRow && (
            <>
              <div className="printable-area rounded-lg border border-border bg-white p-6 text-foreground">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold">{profile?.clinicName}</p>
                      <p className="text-xs text-muted-foreground">Payment Receipt</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Date: {receiptRow.date}</p>
                    <p>Patient: {receiptRow.patientName}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between border-b border-dashed border-border pb-2">
                    <span>{receiptRow.description}</span>
                    <span className="font-medium">₹{receiptRow.amount.toLocaleString("en-IN")}</span>
                  </div>
                  {receiptRow.status === "Partially Paid" && receiptRow.amountPaid !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Paid so far</span>
                      <span>₹{receiptRow.amountPaid.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-[11px] text-muted-foreground">Generated by DentVerse — for demonstration purposes only.</p>
                  <Badge variant={statusBadgeVariant(receiptRow.status)}>{receiptRow.status}</Badge>
                </div>
              </div>

              {whatsappSent ? (
                <div className="no-print rounded-lg bg-[#e5ded5] p-4">
                  <div className="rounded-lg bg-[#d9fdd3] px-3 py-2 text-sm shadow-sm">
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
                      <MessageCircle className="h-3 w-3" /> DentVerse Clinic
                    </p>
                    <p>Hi {receiptRow.patientName.split(" ")[0]}, here's your receipt for {receiptRow.description} — ₹{receiptRow.amount.toLocaleString("en-IN")}. Thank you!</p>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sent via WhatsApp
                  </p>
                </div>
              ) : (
                <DialogFooter className="no-print">
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print / Save as PDF
                  </Button>
                  <Button onClick={() => setWhatsappSent(true)}>
                    <Send className="h-4 w-4" /> Send via WhatsApp
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
