import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as settingsService from '../services/settings.service';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const data = await settingsService.getProfile(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const data = await settingsService.updateProfile(req.user!.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const data = await settingsService.changePassword(req.user!.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
