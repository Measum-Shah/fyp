import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccountById,
  getBankAccounts,
  updateBankAccount,
} from "../controllers/bankAccount.controller";
import {
  bankAccountIdParamSchema,
  createBankAccountSchema,
  listBankAccountsQuerySchema,
  updateBankAccountSchema,
} from "../validators/bankAccount.validator";

const router = Router();

// All Bank Account routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/bank-accounts
router.get(
  "/",
  requireHrAccess("bank_account.view"), validate(listBankAccountsQuerySchema, "query"), getBankAccounts);

// GET /api/bank-accounts/:id
router.get(
  "/:id",
  requireHrAccess("bank_account.view"), validate(bankAccountIdParamSchema, "params"), getBankAccountById);

// POST /api/bank-accounts
router.post(
  "/",
  requireHrAccess("bank_account.create"), validate(createBankAccountSchema, "body"), createBankAccount);

// PUT /api/bank-accounts/:id
router.put(
  "/:id",
  requireHrAccess("bank_account.update"),
  validate(bankAccountIdParamSchema, "params"),
  validate(updateBankAccountSchema, "body"),
  updateBankAccount
);

// DELETE /api/bank-accounts/:id
router.delete(
  "/:id",
  requireHrAccess("bank_account.delete"), validate(bankAccountIdParamSchema, "params"), deleteBankAccount);

export default router;
