import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema, registerSchema } from "../utils/validators.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const result = await authService.register(body, res);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body, res);
  res.json({ success: true, data: result });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[authService.REFRESH_COOKIE] as string | undefined;
  const result = await authService.refresh(token, res);
  res.json({ success: true, data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[authService.REFRESH_COOKIE] as string | undefined;
  await authService.logout(token, res);
  res.json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.id);
  res.json({ success: true, data: { user } });
});
