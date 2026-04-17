// src/tests/integration/tasks.test.ts
import request from "supertest";
import app from "../../app";
import { setupTestDB } from "../setup";

process.env.JWT_SECRET = "test-secret-integration";
process.env.JWT_EXPIRES_IN = "1h";

setupTestDB();

// Helper: register + login, return token
const getAuthToken = async (
  email = "taskuser@example.com",
  password = "password123"
): Promise<string> => {
  await request(app)
    .post("/api/auth/signup")
    .send({ name: "Task User", email, password });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.data.token;
};

describe("GET /api/tasks", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("should return empty array for new user", async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("should return only the authenticated user's tasks", async () => {
    const token1 = await getAuthToken("user1@example.com");
    const token2 = await getAuthToken("user2@example.com");

    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .send({ title: "User 1 Task" });

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token2}`);

    expect(res.body.data).toHaveLength(0);
  });
});

describe("POST /api/tasks", () => {
  let token: string;

  beforeEach(async () => {
    token = await getAuthToken("creator@example.com");
  });

  it("should create a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "My Task", description: "Do the thing", status: "pending" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("My Task");
    expect(res.body.data.status).toBe("pending");
  });

  it("should default status to pending", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "No Status Task" });

    expect(res.body.data.status).toBe("pending");
  });

  it("should create task with dueDate", async () => {
    const dueDate = "2025-12-31";
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Dated Task", dueDate });

    expect(res.status).toBe(201);
    expect(res.body.data.dueDate).toBeDefined();
  });

  it("should return 400 for missing title", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "No title" });
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid status", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Bad Status", status: "in-progress" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/tasks/:id", () => {
  let token: string;
  let taskId: string;

  beforeEach(async () => {
    token = await getAuthToken("updater@example.com");
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original Title" });
    taskId = res.body.data._id;
  });

  it("should update a task", async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Title", status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated Title");
    expect(res.body.data.status).toBe("completed");
  });

  it("should return 404 for non-existent task", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .put(`/api/tasks/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Ghost" });
    expect(res.status).toBe(404);
  });

  it("should not allow updating another user's task", async () => {
    const token2 = await getAuthToken("attacker@example.com");
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ title: "Hijacked" });
    expect(res.status).toBe(404);
  });

  it("should return 400 for invalid task id format", async () => {
    const res = await request(app)
      .put("/api/tasks/not-a-real-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:id", () => {
  let token: string;
  let taskId: string;

  beforeEach(async () => {
    token = await getAuthToken("deleter@example.com");
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "To Be Deleted" });
    taskId = res.body.data._id;
  });

  it("should delete a task", async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 404 after deletion", async () => {
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("should not allow deleting another user's task", async () => {
    const token2 = await getAuthToken("other@example.com");
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token2}`);
    expect(res.status).toBe(404);
  });
});

describe("Task filtering", () => {
  let token: string;

  beforeEach(async () => {
    token = await getAuthToken("filter@example.com");
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Pending Task", status: "pending" });
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Completed Task", status: "completed" });
  });

  it("should filter by status=pending", async () => {
    const res = await request(app)
      .get("/api/tasks?status=pending")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe("pending");
  });

  it("should filter by status=completed", async () => {
    const res = await request(app)
      .get("/api/tasks?status=completed")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe("completed");
  });
});
