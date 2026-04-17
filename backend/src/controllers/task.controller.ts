import { Response, NextFunction } from "express";
import { success, z } from "zod";
import { Task } from "../models/Task";
import { AuthenticatedRequest, TaskFilters } from "../types";
import { getRedisClient, userTasksCacheKey, CACHE_TTL } from "../config/redis";

const createTaskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["pending", "completed"]).optional(),
    dueDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional())
})

const updateTaskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["pending", "completed"]).optional(),
    dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().date().optional().nullable())
})

const invalidateUserCache = async (userId: string): Promise<void> => {
    try {
        const redis = getRedisClient()
        const key = userTasksCacheKey(userId)
        await redis.del(key)
    } catch (error) {
        console.error("failed to invalidate cache for user", userId);
    }
}

export const getTasks = async (req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id
        const { status, dueDate } = req.query as TaskFilters

        const isFiltered = !!(status || dueDate)
        const cacheKey = userTasksCacheKey(userId)
        if (!isFiltered) {
            try {
                const redis = getRedisClient()
                const cached = await redis.get(cacheKey)
                if (cached) {
                    res.json({ success: true, data: JSON.parse(cached), fromCache: true })
                    return;
                }
            } catch (error) {

            }
        }
        const filter: Record<string, unknown> = { owner: userId };
        if (status) filter.status = status;
        if (dueDate) filter.dueDate = { $lte: new Date(dueDate) };
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        if (!isFiltered) {
            try {
                const redis = getRedisClient()
                await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(tasks))
            } catch (error) {

            }
        }
        res.json({ success: true, data: tasks })

    } catch (error) {
        next(error)
    }
}

export const createTask = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id
        const body = createTaskSchema.parse(req.body)
        const task = await Task.create({
            ...body,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            owner: userId
        });
        await invalidateUserCache(userId)
        res.status(201).json({
            success: true,
            message: "Task created",
            data: task
        })
    } catch (error) {
        next(error)
    }
}

export const updateTask = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id
        const { id } = req.params
        const body = updateTaskSchema.parse(req.body)

        const task = await Task.findOne({ _id: id, owner: userId })
        if (!task) {
            throw new Error("task not found");
        }
        const updateData: Record<string, unknown> = {}
        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description
        if (body.status !== undefined) updateData.status = body.status
        if (body.dueDate !== undefined){
            updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        }
        const updatedTask = await Task.findByIdAndUpdate(id,updateData,{
            new:true,
            runValidators:true
        })
        await invalidateUserCache(userId)
        res.json({success:true,message:"Task updated",data:updatedTask})
    } catch (error) {
        next(error)
    }
}

export const deleteTask = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id
        const { id } = req.params
        const task = await Task.findOneAndDelete({ _id: id, owner: userId })
        if (!task) {
            throw new Error("Task not found");
        }
        await invalidateUserCache(userId)
        res.json({
            success: true,
            message: "Task deleted"
        })
    } catch (error) {
        next(error)
    }
}
