import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, JwtPayload } from "../types";

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            error: "no token provided",
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as string
    try {
        const decoded = jwt.verify(token, secret) as unknown as JwtPayload;
        req.user = { id: decoded.id, email: decoded.email }
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: "Token expired"
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: "Invalid Token"
        });
    }
}