// src/tests/unit/errorHandler.test.ts
import { Request, Response } from "express";
import { ZodError, z } from "zod";
import mongoose from "mongoose";
import { errorHandler, AppError, notFound } from "../../middleware/errorHandler";

const mockReq = {} as Request;
const mockNext = jest.fn();

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler middleware", () => {
  it("handles ZodError with 400", () => {
    const schema = z.object({ email: z.string().email() });
    let err: ZodError;
    try {
      schema.parse({ email: "bad" });
    } catch (e) {
      err = e as ZodError;
    }
    const res = mockRes();
    errorHandler(err!, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
  });

  it("handles AppError with correct status", () => {
    const err = new AppError("Not found", 404);
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Not found" });
  });

  it("handles Mongoose CastError with 400", () => {
    const err = new mongoose.Error.CastError("ObjectId", "bad-id", "_id");
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid ID format" });
  });

  it("handles unknown errors with 500", () => {
    const err = new Error("Something went wrong");
    const res = mockRes();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Internal server error" });
    consoleSpy.mockRestore();
  });
});

describe("notFound middleware", () => {
  it("returns 404 JSON", () => {
    const res = mockRes();
    notFound(mockReq, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Route not found" });
  });
});
