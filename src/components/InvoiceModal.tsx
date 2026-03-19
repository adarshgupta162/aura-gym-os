import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface GymDetails {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  city: string | null;
}

interface MemberDetails {
  full_name: string;
  member_code: string;
  phone: string | null;
  email: string | null;
}

interface PaymentDetails {
  id: string;
  amount: number;
  method: string;
  description: string | null;
  status: string;
  payment_date: string;
}

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  gym: GymDetails;
  member: MemberDetails;
  payment: PaymentDetails;
}

function generateInvoiceNumber(paymentId: string): string {
  const short = paymentId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `INV-${short}`;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "";
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // If starts with 91 and has 12 digits, use as-is; otherwise prepend 91 for India
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

export function InvoiceModal({ open, onClose, gym, member, payment }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const invoiceNumber = generateInvoiceNumber(payment.id);
  const formattedDate = new Date(payment.payment_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedAmount = `₹${Number(payment.amount).toLocaleString("en-IN")}`;

  const handleDownloadPDF = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoiceNumber} - ${gym.name}</title>
          <meta charset="UTF-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a1a; }
            .invoice-wrap { max-width: 720px; margin: 0 auto; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 28px; }
            .gym-name { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 4px; }
            .gym-meta { font-size: 12px; color: #6b7280; line-height: 1.6; }
            .invoice-label { font-size: 28px; font-weight: 800; color: #4f46e5; text-align: right; }
            .invoice-number { font-size: 13px; color: #6b7280; text-align: right; margin-top: 4px; }
            .invoice-date { font-size: 12px; color: #6b7280; text-align: right; margin-top: 2px; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
            .info-block p { font-size: 13px; color: #374151; line-height: 1.7; }
            .info-block strong { color: #111; }
            .table-wrap { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 28px; }
            table { width: 100%; border-collapse: collapse; }
            thead tr { background: #f3f4f6; }
            th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; padding: 10px 16px; text-align: left; }
            td { font-size: 13px; color: #374151; padding: 14px 16px; border-top: 1px solid #f3f4f6; }
            .amount-row td { font-size: 15px; font-weight: 700; color: #111; }
            .status-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .status-pending { background: #fee2e2; color: #991b1b; }
            .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.7; }
            .method-cap { text-transform: capitalize; }
            .logo-img { max-height: 56px; max-width: 120px; object-fit: contain; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="invoice-wrap">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleWhatsApp = () => {
    const phone = formatPhone(member.phone);
    if (!phone) {
      toast.error("This member does not have a phone number on record.");
      return;
    }
    const text = encodeURIComponent(
      `🏋️ *${gym.name}* — Payment Receipt\n\n` +
      `Invoice No: *${invoiceNumber}*\n` +
      `Date: ${formattedDate}\n\n` +
      `Dear *${member.full_name}* (${member.member_code}),\n\n` +
      `Your payment has been recorded successfully.\n\n` +
      `💰 Amount: *${formattedAmount}*\n` +
      `💳 Method: ${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}\n` +
      `📋 Status: ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}\n` +
      (payment.description ? `📝 Note: ${payment.description}\n` : "") +
      `\nThank you for your payment! 💪`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const statusClass = payment.status === "completed" ? "text-emerald-400" : "text-red-400";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Invoice Preview
            <span className="ml-auto flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Share on WhatsApp
              </button>
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice content for preview AND print */}
        <div ref={printRef} className="mt-2">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-border pb-5 mb-6">
            <div>
              {gym.logo_url && (
                <img
                  src={gym.logo_url}
                  alt={gym.name}
                  className="h-12 max-w-[100px] object-contain mb-2"
                />
              )}
              <div className="text-base font-bold text-foreground">{gym.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {gym.address && <div>{gym.address}{gym.city ? `, ${gym.city}` : ""}</div>}
                {gym.phone && <div>📞 {gym.phone}</div>}
                {gym.email && <div>✉️ {gym.email}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-primary">INVOICE</div>
              <div className="text-xs text-muted-foreground mt-1">{invoiceNumber}</div>
              <div className="text-xs text-muted-foreground">{formattedDate}</div>
            </div>
          </div>

          {/* Billed to */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Billed To</div>
              <div className="text-sm font-semibold text-foreground">{member.full_name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                <div>Member Code: {member.member_code}</div>
                {member.phone && <div>📞 {member.phone}</div>}
                {member.email && <div>✉️ {member.email}</div>}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Payment Info</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                <div>Status: <span className={`font-semibold capitalize ${statusClass}`}>{payment.status}</span></div>
                <div>Method: <span className="capitalize text-foreground">{payment.method}</span></div>
                <div>Date: <span className="text-foreground">{formattedDate}</span></div>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{payment.description || "Gym Membership Payment"}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formattedAmount}</td>
                </tr>
                <tr className="border-t border-border bg-muted/30">
                  <td className="px-4 py-3 font-bold text-foreground text-right">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground text-base">{formattedAmount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-4 text-[11px] text-muted-foreground text-center leading-relaxed">
            <p>Thank you for your payment! This is a computer-generated invoice and requires no signature.</p>
            <p className="mt-1">{gym.name}{gym.address ? ` · ${gym.address}` : ""}{gym.phone ? ` · ${gym.phone}` : ""}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
