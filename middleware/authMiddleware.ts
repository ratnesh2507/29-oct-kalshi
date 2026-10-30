import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, "secret") as {
      userId: string;
    };

    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};
