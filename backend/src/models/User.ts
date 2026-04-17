import mongoose,{Document,Schema} from "mongoose";
import bcrypt from "bcrypt"

export interface IUser extends Document{
    name:string;
    email:string;
    password:string;
    createdAt:Date;
    comparePassword(candidate:string):Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name:{
            type:String,
            required:[true,"Name is required"],
            trim:true,
            minlength:[2,"Name must be at least 2 characters"],
            maxlength:[40,"Name must be not more than 40 characters"]
        },
        email:{
            type:String,
            required:[true,"Email is required"],
            unique:true,
            lowercase:true,
            trim:true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },
        password:{
            type:String,
            required:[true,"password is required"],
            minlength:[6,"password must be atleast 6 characters"],
            select:false
        }
    },
    {timestamps:true}
);

//hash password before save 
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password,salt);
});

userSchema.methods.comparePassword = async function (
    candidate:string
) : Promise<boolean> {
    return bcrypt.compare(candidate,this.password);
}

export const User = mongoose.model<IUser>("User",userSchema);