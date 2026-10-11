import { z } from "zod";

// ─── :branchId route param ───────────────────────────────────────────────────
// Named branchId (not id) since the resource being acted on is the branch's
// configured device, not a record of its own — there is no separate
// biometric-config id (see biometricDevice.service.ts's header comment on
// reusing erp_branches.ip/port).
export const biometricBranchIdParamSchema = z.object({
  branchId: z.coerce
    .number({ error: "Campus id must be a number" })
    .int("Campus id must be a valid integer")
    .positive("Campus id must be a valid integer"),
});

export type BiometricBranchIdParam = z.infer<typeof biometricBranchIdParamSchema>;