import { Router, Request, Response } from "express";
import { getPackages, getTools } from "../data/store.js";

export const publicRouter = Router();

publicRouter.get("/packages", (_req: Request, res: Response) => {
  res.json(getPackages());
});

publicRouter.get("/tools", (_req: Request, res: Response) => {
  res.json(getTools());
});
