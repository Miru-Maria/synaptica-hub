import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, DollarSign, Clock, AlertTriangle, CheckCircle2, FileText, Download, Search, X, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

interface Invoice {
  id: string;
  clientName: string;
  contactId?: string;
  description: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  source: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft: "bg-neutral-700 text-neutral-300",
  Sent: "bg-blue-500/20 text-blue-400",
  Paid: "bg-emerald-500/20 text-emerald-400",
  Overdue: "bg-red-500/20 text-red-400",
};

const STATUS_OPTIONS: InvoiceStatus[] = ["Draft", "Sent", "Paid", "Overdue"];
const CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "AUD", "CAD"];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(16, 16, 16);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("SYNAPTICA", 20, 30);

  doc.setTextColor(163, 163, 163);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Knowledge Architecture & AI Documentation", 20, 38);

  doc.setTextColor(163, 163, 163);
  doc.setFontSize(9);
  doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(invoice.id.toUpperCase(), pageWidth - 20, 33, { align: "right" });

  let y = 65;

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text("BILL TO", 20, y);
  y += 8;
  doc.setTextColor(38, 38, 38);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, 20, y);
  y += 10;

  const detailsStartY = 65;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice Date", pageWidth - 80, detailsStartY);
  doc.setTextColor(38, 38, 38);
  doc.setFontSize(10);
  doc.text(formatDate(invoice.invoiceDate), pageWidth - 80, detailsStartY + 7);

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text("Due Date", pageWidth - 80, detailsStartY + 18);
  doc.setTextColor(38, 38, 38);
  doc.setFontSize(10);
  doc.text(formatDate(invoice.dueDate), pageWidth - 80, detailsStartY + 25);

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text("Status", pageWidth - 80, detailsStartY + 36);
  doc.setFontSize(10);
  if (invoice.status === "Paid") doc.setTextColor(16, 185, 129);
  else if (invoice.status === "Overdue") doc.setTextColor(239, 68, 68);
  else if (invoice.status === "Sent") doc.setTextColor(59, 130, 246);
  else doc.setTextColor(120, 120, 120);
  doc.text(invoice.status, pageWidth - 80, detailsStartY + 43);

  y = Math.max(y + 10, detailsStartY + 55);

  doc.setFillColor(245, 245, 245);
  doc.rect(20, y, pageWidth - 40, 10, "F");
  doc.setTextColor(82, 82, 82);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 25, y + 7);
  doc.text("AMOUNT", pageWidth - 25, y + 7, { align: "right" });
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(38, 38, 38);
  doc.setFontSize(10);

  const descLines = doc.splitTextToSize(invoice.description, pageWidth - 90);
  doc.text(descLines, 25, y);
  doc.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 25, y, { align: "right" });
  y += descLines.length * 6 + 10;

  doc.setDrawColor(229, 229, 229);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total Due", 25, y);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 25, y, { align: "right" });

  y = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(229, 229, 229);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;
  doc.setTextColor(163, 163, 163);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Synaptica — Knowledge Architecture & AI Documentation Consultancy", pageWidth / 2, y, { align: "center" });
  doc.text("Thank you for your business.", pageWidth / 2, y + 5, { align: "center" });

  doc.save(`invoice-${invoice.id}.pdf`);
}

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "All">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    clientName: "",
    contactId: "",
    description: "",
    amount: 0,
    currency: "USD",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    status: "Draft" as InvoiceStatus,
  });

  const loadData = useCallback(async () => {
    try {
      const [invRes, conRes] = await Promise.all([
        fetch("/api/admin/invoices", { headers: authHeaders() }),
        fetch("/api/admin/invoices/contacts", { headers: authHeaders() }),
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (conRes.ok) setContacts(await conRes.json());
    } catch (err) {
      console.error("Failed to load invoices:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "All" && inv.status !== statusFilter) return false;
      if (dateFrom && inv.invoiceDate < dateFrom) return false;
      if (dateTo && inv.invoiceDate > dateTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!inv.clientName.toLowerCase().includes(q) && !inv.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, dateFrom, dateTo, searchQuery]);

  const summary = useMemo(() => {
    const primaryCurrency = invoices.length > 0 ? invoices[0].currency : "USD";
    const sameInvoices = invoices.filter((inv) => inv.currency === primaryCurrency);
    const totalInvoiced = sameInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCollected = sameInvoices.filter((inv) => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = sameInvoices.filter((inv) => inv.status === "Sent" || inv.status === "Draft").reduce((sum, inv) => sum + inv.amount, 0);
    const overdueCount = invoices.filter((inv) => inv.status === "Overdue").length;
    return { totalInvoiced, totalCollected, outstanding, overdueCount, currency: primaryCurrency };
  }, [invoices]);

  const resetForm = () => {
    setFormData({
      clientName: "",
      contactId: "",
      description: "",
      amount: 0,
      currency: "USD",
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      status: "Draft",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.description || !formData.amount || !formData.dueDate) return;

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/invoices/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setInvoices((prev) => prev.map((inv) => (inv.id === editingId ? updated : inv)));
        }
      } else {
        const res = await fetch("/api/admin/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newInv = await res.json();
          setInvoices((prev) => [newInv, ...prev]);
        }
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save invoice:", err);
    }
  };

  const updateStatus = async (id: string, status: InvoiceStatus) => {
    try {
      const res = await fetch(`/api/admin/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    }
  };

  const startEdit = (inv: Invoice) => {
    setFormData({
      clientName: inv.clientName,
      contactId: inv.contactId || "",
      description: inv.description,
      amount: inv.amount,
      currency: inv.currency,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      status: inv.status,
    });
    setEditingId(inv.id);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-400">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-800">
                <DollarSign className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total Invoiced</p>
                <p className="text-lg font-semibold text-neutral-100">{formatCurrency(summary.totalInvoiced, summary.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Collected</p>
                <p className="text-lg font-semibold text-emerald-400">{formatCurrency(summary.totalCollected, summary.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Outstanding</p>
                <p className="text-lg font-semibold text-blue-400">{formatCurrency(summary.outstanding, summary.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Overdue</p>
                <p className="text-lg font-semibold text-red-400">{summary.overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices..."
              className="bg-neutral-800 border-neutral-700 text-neutral-100 pl-9 w-48"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "All")}
            className="bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="bg-neutral-800 border-neutral-700 text-neutral-100 w-36"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="bg-neutral-800 border-neutral-700 text-neutral-100 w-36"
          />
          {(statusFilter !== "All" || dateFrom || dateTo || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStatusFilter("All"); setDateFrom(""); setDateTo(""); setSearchQuery(""); }}
              className="text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Invoice
        </Button>
      </div>

      {showForm && (
        <Card className="bg-neutral-900 border-emerald-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-neutral-100">
              {editingId ? "Edit Invoice" : "New Invoice"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Client Name</Label>
                {contacts.length > 0 && (
                  <select
                    value={formData.contactId}
                    onChange={(e) => {
                      const contact = contacts.find((c) => c.id === e.target.value);
                      if (contact) {
                        setFormData({ ...formData, clientName: contact.name, contactId: contact.id });
                      } else {
                        setFormData({ ...formData, contactId: "" });
                      }
                    }}
                    className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm mb-2"
                  >
                    <option value="">-- Select existing contact --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.source})</option>
                    ))}
                  </select>
                )}
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value, contactId: "" })}
                  placeholder="Or enter a new client name"
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Currency</Label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-neutral-400 text-xs">Description (Package / Service)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Knowledge Architecture Sprint"
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Amount</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                  className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={resetForm} className="border-neutral-700 text-neutral-300">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!formData.clientName || !formData.description || !formData.amount || !formData.dueDate}
              >
                {editingId ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredInvoices.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500">
              {invoices.length === 0 ? "No invoices yet. Create one to get started." : "No invoices match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-neutral-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50">
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Invoice Date</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30 transition-colors">
                    <td className="px-4 py-3 text-neutral-100 font-medium">{inv.clientName}</td>
                    <td className="px-4 py-3 text-neutral-400 max-w-[200px] truncate">{inv.description}</td>
                    <td className="px-4 py-3 text-neutral-100 text-right font-mono">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3 text-neutral-400">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-3 text-neutral-400">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="relative group inline-block">
                        <button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                          {inv.status}
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        <div className="absolute left-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10 hidden group-hover:block min-w-[100px]">
                          {STATUS_OPTIONS.filter((s) => s !== inv.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(inv.id, s)}
                              className="block w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 first:rounded-t-md last:rounded-b-md"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(inv)}
                          className="text-neutral-500 hover:text-neutral-300 h-7 w-7 p-0"
                          title="Edit"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateInvoicePDF(inv)}
                          className="text-neutral-500 hover:text-emerald-400 h-7 w-7 p-0"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvoice(inv.id)}
                          className="text-neutral-500 hover:text-red-400 h-7 w-7 p-0"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
