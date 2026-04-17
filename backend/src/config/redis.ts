import Redis from "ioredis"

let redisClient: Redis;
export const getRedisClient = (): Redis =>{
    if(!redisClient){
        const url = process.env.REDIS_URL || "redis://localhost:6379"
        redisClient = new Redis(url,{
            lazyConnect:true,
            maxRetriesPerRequest:3,
        });
        redisClient.on("connect",()=>console.log("Redis connected"));
        redisClient.on("error",(err)=>console.error("Redis error",err));
    }
    return redisClient;
}
export const CACHE_TTL = 60*5
export const userTasksCacheKey = (userId:string) => `tasks:user:${userId}`;