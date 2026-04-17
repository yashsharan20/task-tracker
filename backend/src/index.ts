import "dotenv/config"
import app from "./app"

import { connectDB } from "./config/database"
import { getRedisClient } from "./config/redis"
const PORT = process.env.PORT || 5000

const start = async () =>{
    try {
        await connectDB();
        await getRedisClient().connect();
        app.listen(PORT,()=>{
            console.log(`server running on PORT ${PORT}`);
        })
    } catch (error) {
        console.error("Failed to start server",error);
        process.exit(1);
    }
}
start();