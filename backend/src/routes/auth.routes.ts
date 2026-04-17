import { Router } from "express";
import { signup,login } from "../controllers/auth.controller";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
    windowMs:15*60*1000,
    max:10,
    message:{success:false,error:"Too many attempts"},
    standardHeaders:true,
    legacyHeaders:false
});

router.post("/signup",authLimiter,signup)
router.post("/login",authLimiter,login)
export default router