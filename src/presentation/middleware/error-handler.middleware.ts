import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[Error] ${err.message}`);

  // Known domain/application errors → 400/404
  const clientErrors = [
    "not found", "cannot", "must", "invalid", "forbidden",
    "only a", "already", "does not", "no remaining", "exceeded",
  ];
  const msg = err.message.toLowerCase();
  const isClientError = clientErrors.some((kw) => msg.includes(kw));

  if (msg.includes("not found")) {
    res.status(404).json({ error: err.message });
  } else if (msg.includes("forbidden")) {
    res.status(403).json({ error: err.message });
  } else if (isClientError) {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
}
