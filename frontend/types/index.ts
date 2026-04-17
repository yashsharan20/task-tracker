export type TaskStatus = "pending" | "completed";

export interface User{
    id:string;
    name:string;
    email:string;
}

export interface Task{
    _id:string;
    title:string;
    description?:string;
    status:TaskStatus;
    dueDate?:string;
    owner:string;
    createdAt:string;
    updatedAt:string;
}

export interface AuthResponse{
    success:boolean;
    message?:string;
    data:{
        token:string;
        user:User;
    }
}
export interface TasksResponse{
    success:boolean;
    data:Task[];
    fromCache?:boolean;
}

export interface TaskResponse{
    success:boolean;
    message?:string;
    data:Task;
}
export interface CreateTaskInput{
    title:string;
    description?:string;
    status?:TaskStatus;
    dueDate?:string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}
