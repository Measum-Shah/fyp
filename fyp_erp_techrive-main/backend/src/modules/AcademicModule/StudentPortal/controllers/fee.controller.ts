import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as feeService from '../services/fee.service';

export const get = async (req: AuthRequest, res: Response) => {
  try {
    const data = await feeService.get(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const data = await feeService.getPaymentWorkspace(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const data = await feeService.getPaymentHistory(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const payFee = async (req: AuthRequest, res: Response) => {
  try {
    const data = await feeService.payFee(req.user!.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
