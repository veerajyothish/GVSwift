import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface InvoiceOrderItem {
  productName: string;
  variantSku: string | null;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

interface InvoiceAddress {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface InvoiceOrder {
  id: string;
  createdAt: string;
  items: InvoiceOrderItem[];
  subtotalPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  totalPaise: number;
  address: InvoiceAddress;
  customerEmail?: string;
}

function formatPaise(paise: number): string {
  return `INR ${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface AutoTablePDF extends jsPDF {
  autoTable: (options: unknown) => jsPDF;
  lastAutoTable: {
    finalY: number;
  };
}

export function downloadInvoicePdf(order: InvoiceOrder) {
  const doc = new jsPDF();
  const autotableDoc = doc as unknown as AutoTablePDF;

  // 1. Branding Header
  doc.setFillColor(252, 249, 248); // Cream background for header accent
  doc.rect(0, 0, 210, 45, "F");

  // Wine Red Logo Accent line
  doc.setFillColor(86, 25, 34); // Wine Red
  doc.rect(0, 43, 210, 2, "F");

  // Brand Name
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(86, 25, 34); // Wine Red: #561922
  doc.text("GVSwift", 20, 28);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(112, 100, 93); // Dark muted cream-brown
  doc.text("VINTAGE RESERVE VINTNERS & APPAREL", 20, 35);

  // Document Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(86, 25, 34);
  doc.text("INVOICE", 190, 28, { align: "right" });

  // 2. Metadata: Order & Customer Information
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(10);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("INVOICE DETAILS", 20, 58);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Order Number: #${order.id.slice(0, 8).toUpperCase()}`, 20, 65);
  doc.text(`Order Date: ${dateStr}`, 20, 71);
  doc.text(`Payment Mode: Cash on Delivery (COD)`, 20, 77);

  // Customer & Shipping Address info
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("SHIPPED TO", 120, 58);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(order.address.fullName, 120, 65);
  doc.text(order.address.line1, 120, 71);
  if (order.address.line2) {
    doc.text(order.address.line2, 120, 77);
  }
  doc.text(
    `${order.address.city}, ${order.address.state} — ${order.address.pincode}`,
    120,
    order.address.line2 ? 83 : 77
  );
  doc.text(
    `Phone: ${order.address.phone}`,
    120,
    order.address.line2 ? 89 : 83
  );
  if (order.customerEmail) {
    doc.text(
      `Email: ${order.customerEmail}`,
      120,
      order.address.line2 ? 95 : 89
    );
  }

  // Draw division line
  doc.line(20, 102, 190, 102);

  // 3. Itemized Products Table
  const tableHeaders = ["Item Description", "SKU", "Qty", "Unit Price", "Total Price"];
  const tableRows = order.items.map((item) => [
    item.productName,
    item.variantSku ?? "N/A",
    item.quantity.toString(),
    formatPaise(item.unitPricePaise),
    formatPaise(item.lineTotalPaise),
  ]);

  autotableDoc.autoTable({
    startY: 108,
    head: [tableHeaders],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [86, 25, 34], // Wine Red
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
    },
  });

  // 4. Financial Calculations & GST breakdown
  // GST is 18% (9% CGST + 9% SGST)
  // Assuming prices are GST inclusive, we calculate base price and GST details
  const subtotal = order.subtotalPaise;
  const baseValue = subtotal / 1.18;
  const gstValue = subtotal - baseValue;
  const cgst = gstValue / 2;
  const sgst = gstValue / 2;

  const currentY = autotableDoc.lastAutoTable.finalY + 12;

  // Add GST Box on the left, Totals on the right
  doc.setFillColor(252, 249, 248);
  doc.rect(20, currentY, 80, 42, "F");
  doc.setDrawColor(229, 220, 214);
  doc.rect(20, currentY, 80, 42, "S");

  // GST details inside the box
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(86, 25, 34);
  doc.text("GST TAX BREAKDOWN (INCLUSIVE)", 25, currentY + 7);

  doc.setFont("Helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Taxable Base Value:`, 25, currentY + 16);
  doc.text(formatPaise(baseValue), 95, currentY + 16, { align: "right" });

  doc.text(`CGST (9.0%):`, 25, currentY + 24);
  doc.text(formatPaise(cgst), 95, currentY + 24, { align: "right" });

  doc.text(`SGST (9.0%):`, 25, currentY + 32);
  doc.text(formatPaise(sgst), 95, currentY + 32, { align: "right" });

  doc.setFont("Helvetica", "bold");
  doc.text(`Total Tax:`, 25, currentY + 38);
  doc.text(formatPaise(gstValue), 95, currentY + 38, { align: "right" });

  // Summary list on the right side
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  doc.text("Subtotal:", 140, currentY + 7, { align: "right" });
  doc.text(formatPaise(order.subtotalPaise), 190, currentY + 7, { align: "right" });

  doc.text("Shipping Charge:", 140, currentY + 15, { align: "right" });
  doc.text(
    order.shippingPaise === 0 ? "FREE" : formatPaise(order.shippingPaise),
    190,
    currentY + 15,
    { align: "right" }
  );

  if (order.codFeePaise > 0) {
    doc.text("COD Handling Fee:", 140, currentY + 23, { align: "right" });
    doc.text(formatPaise(order.codFeePaise), 190, currentY + 23, { align: "right" });
  }

  // Draw a total accent line
  doc.setDrawColor(86, 25, 34);
  doc.setLineWidth(0.5);
  doc.line(120, currentY + 28, 190, currentY + 28);

  // Total amount
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(86, 25, 34);
  doc.text("Grand Total:", 140, currentY + 36, { align: "right" });
  doc.text(formatPaise(order.totalPaise), 190, currentY + 36, { align: "right" });

  // 5. Footer Terms
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for shopping with GVSwift.", 105, 275, { align: "center" });
  doc.text(
    "This is a computer-generated invoice and requires no signature.",
    105,
    280,
    { align: "center" }
  );

  // Save the PDF
  doc.save(`Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
}
