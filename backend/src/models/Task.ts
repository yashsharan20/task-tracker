import mongoose, {Document,Schema,Types} from "mongoose";

export type TaskStatus = "pending" | "completed"

export interface ITask extends Document{
    title:string;
    description?:string;
    status:TaskStatus;
    dueDate?:Date;
    owner:Types.ObjectId;
    createdAt:Date;
    updatedAt:Date;
}

const taskSchema = new Schema<ITask>({
    title:{
        type:String,
        required:true,
        trim:true,
        minlength:1,
        maxlength:200
    },
    description:{
        type:String,
        trim:true,
        maxlength:2000
    },
    status:{
        type:String,
        enum:{
            values:["pending","completed"],
            message:"status must be pending or completed"
        },
        default:"pending"
    },
    dueDate:{
        type:Date,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},{timestamps:true})

taskSchema.index({owner:1})
taskSchema.index({status:1})
taskSchema.index({owner:1,status:1})
taskSchema.index({owner:1,dueDate:1})
taskSchema.index({owner:1,createdAt:-1})

export const Task = mongoose.model<ITask>("Task",taskSchema);