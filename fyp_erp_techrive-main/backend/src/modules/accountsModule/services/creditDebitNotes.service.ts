import { prisma } from "../../../config/db";

export const getCreditDebitNotes = async () => {
  return await prisma.accCreditDebitNote.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const createCreditDebitNote = async (data: {
  type: string; // CREDIT_NOTE, DEBIT_NOTE
  party_type: string; // CUSTOMER, VENDOR
  party_name: string;
  date: string;
  amount: number;
  reason: string;
  reference_doc?: string;
}) => {
  const count = await prisma.accCreditDebitNote.count();
  const prefix = data.type === "CREDIT_NOTE" ? "CN" : "DN";
  const noteNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  return await prisma.accCreditDebitNote.create({
    data: {
      note_number: noteNumber,
      type: data.type,
      party_type: data.party_type,
      party_name: data.party_name,
      date: new Date(data.date),
      amount: data.amount,
      reason: data.reason,
      reference_doc: data.reference_doc || null,
      status: "POSTED",
    },
  });
};
