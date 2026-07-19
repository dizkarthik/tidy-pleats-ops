import ExcelJS from "exceljs";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  formatCustomerSize,
  formatReferralKind,
  formatReferralSource,
} from "@/lib/referrals";

export const runtime = "nodejs";

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export async function GET() {
  await requireUser();

  const customers = await getPrisma().customer.findMany({
    include: {
      referredByCustomer: {
        select: {
          name: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: [{ name: "asc" }, { dateAdded: "desc" }],
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Customers");

  worksheet.columns = [
    { header: "Customer Name", key: "name", width: 28 },
    { header: "Phone Number", key: "phoneNumber", width: 18 },
    { header: "Location", key: "location", width: 22 },
    { header: "Address", key: "address", width: 36 },
    { header: "Birthday Date", key: "birthdayDate", width: 16 },
    { header: "Size", key: "size", width: 12 },
    { header: "Referral Type", key: "referralKind", width: 22 },
    { header: "Referral Source", key: "referralSource", width: 22 },
    { header: "Referred By Customer", key: "referredByCustomer", width: 30 },
    { header: "Notes", key: "notes", width: 42 },
    { header: "Date Added", key: "dateAdded", width: 18 },
  ];

  worksheet.getRow(1).font = { bold: true };

  customers.forEach((customer) => {
    worksheet.addRow({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      location: customer.location ?? "",
      address: customer.address ?? "",
      birthdayDate: formatDate(customer.birthdayDate),
      size: formatCustomerSize(customer.size),
      referralKind: formatReferralKind(customer.referralKind),
      referralSource: formatReferralSource(customer.referralSource),
      referredByCustomer: customer.referredByCustomer
        ? `${customer.referredByCustomer.name} (${customer.referredByCustomer.phoneNumber})`
        : "",
      notes: customer.notes ?? "",
      dateAdded: formatDate(customer.dateAdded),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Disposition": 'attachment; filename="tidy-pleats-customers.xlsx"',
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
