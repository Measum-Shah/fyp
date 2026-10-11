import { z } from "zod";

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

export const reportFilterSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  branch_id: optionalInt,
  session_id: optionalInt,
  program_id: optionalInt,
  class_id: optionalInt,
  student_id: optionalInt,
  payment_mode: z.string().optional(),
  fee_status: z.string().optional(),
  due_status: z
    .enum(["all", "outstanding", "overdue", "paid", "partial"])
    .optional(),
  page: optionalInt,
  limit: optionalInt,
  sort: z.string().optional(),
  search: z.string().optional(),
  group_by: z.enum(["day", "month", "year"]).optional(),
  action: z.string().optional(),
  record_type: z.string().optional(),
  user_id: optionalInt,
});
