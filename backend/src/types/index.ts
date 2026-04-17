import { Request } from "express";

export interface AuthenticatedRequest extends Request{
    user?:{
        id:string;
        email:string;
    }
}

export interface JwtPayload{
    id:string;
    email:string;
    iat?:number;
    exp?:number;
}

export interface ApiResponse<T=unknown>{
    success:boolean;
    message?:string;
    data?:T;
    error?:string;
}

export interface TaskFilters{
    status?:"pending"|"completed";
    dueDate?:string;
}

export interface PaginationOptions{
    page?:number;
    limit?:number;
}