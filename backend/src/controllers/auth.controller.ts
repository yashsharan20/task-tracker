import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { success, z } from "zod";
import { User } from "../models/User";

const signupSchema = z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(6)
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const generateToken = (id: string, email: string): string => {
    const secret = process.env.JWT_SECRET!
    const payload = { id, email }
    return jwt.sign(payload, secret, {
        expiresIn: "1d",
    } as jwt.SignOptions)
}

export const signup = async (
    req:Request,
    res:Response,
    next:NextFunction
): Promise<void>=>{
    try {
        const {name,email,password} = signupSchema.parse(req.body)
        const existingUser = await User.findOne({email})
        if(existingUser){
            throw new Error("Email already registered")
        }
        const user = await User.create({name,email,password})
        const token = generateToken(String(user._id),email)
        res.status(201).json({
            success:"true",
            message:"Account created successfully",
            data:{token,user:{id:user._id,name:user.name,email:user.email}}
        })
    } catch (error) {
        next(error);
    }
}

export const login = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const {email,password} = loginSchema.parse(req.body)
        const user = await User.findOne({email}).select("+password")
        if(!user || !(await user.comparePassword(password))){
            throw new Error('Invalid email or password');
        }
        const token = generateToken(String(user._id),email);
        res.json({
            success:true,
            message:"Logged in successfully",
            data:{token,user:{id:user._id,name:user.name,email:user.email}}
        });
    } catch (error) {
        next(error);
    }
}