// src/tests/integration/auth.test.ts
import request from "supertest";
import app from "../../app";
import { User } from "../../models/User";
import { setupTestDB } from "../setup";

process.env.JWT_SECRET = "test-secret-integration";
process.env.JWT_EXPIRES_IN = "1h";

setupTestDB();

describe("POST /api/auth/signup", () => {
  const validUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  it("should create a user and return token", async () => {
    const res = await request(app).post("/api/auth/signup").send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("should hash the password in the database", async () => {
    await request(app).post("/api/auth/signup").send(validUser);
    const user = await User.findOne({ email: validUser.email }).select("+password");
    expect(user?.password).not.toBe(validUser.password);
    expect(user?.password).toMatch(/^\$2[ab]\$/);
  });

  it("should return 409 for duplicate email", async () => {
    await request(app).post("/api/auth/signup").send(validUser);
    const res = await request(app).post("/api/auth/signup").send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validUser, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("should return 400 for short password", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validUser, password: "123" });
    expect(res.status).toBe(400);
  });

  it("should return 400 for missing name", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  const credentials = { email: "login@example.com", password: "secret123" };

  beforeEach(async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ name: "Login User", ...credentials });
  });

  it("should login and return token", async () => {
    const res = await request(app).post("/api/auth/login").send(credentials);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(credentials.email);
  });

  it("should return 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ ...credentials, password: "wrongpass" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "any123" });
    expect(res.status).toBe(401);
  });

  it("should return 400 for missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email });
    expect(res.status).toBe(400);
  });
});
