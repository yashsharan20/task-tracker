import express from "express"
import cors from "cors"
import helmet from "helmet"
import "dotenv/config"

import authRoutes from "./routes/auth.routes"
import taskRoutes from "./routes/task.routes"

const app = express()

app.use(helmet());

app.use(
    cors({
        origin:process.env.FRONTEND_URL || "http://localhost:3000",
        credentials:true,
        methods:["GET","POST","PUT","DELETE","OPTIONS"],
        allowedHeaders:["Content-Type","Authorization"]
    })
);

app.use(express.json({limit:"10kb"}));
app.use(express.urlencoded({extended:true}));


app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

export default app
