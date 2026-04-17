// src/tests/unit/auth.middleware.test.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../../middleware/auth";
import { AuthenticatedRequest } from "../../types";

process.env.JWT_SECRET = "test-secret";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe("authenticate middleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if no Authorization header", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    authenticate(req as AuthenticatedRequest, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "No token provided" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if token does not start with Bearer", () => {
    const req = { headers: { authorization: "Basic token123" } } as Request;
    const res = mockRes();
    authenticate(req as AuthenticatedRequest, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 401 if token is invalid", () => {
    const req = { headers: { authorization: "Bearer bad.token.here" } } as Request;
    const res = mockRes();
    authenticate(req as AuthenticatedRequest, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid token" });
  });

  it("should return 401 if token is expired", () => {
    const expiredToken = jwt.sign(
      { id: "user123", email: "test@test.com" },
      "test-secret",
      { expiresIn: -1 }
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` } } as Request;
    const res = mockRes();
    authenticate(req as AuthenticatedRequest, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Token expired" });
  });

  it("should call next and set req.user with valid token", () => {
    const token = jwt.sign({ id: "user123", email: "test@test.com" }, "test-secret", {
      expiresIn: "1h",
    });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    authenticate(req as AuthenticatedRequest, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect((req as AuthenticatedRequest).user).toEqual({
      id: "user123",
      email: "test@test.com",
    });
  });
});
