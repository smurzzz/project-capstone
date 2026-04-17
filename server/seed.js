import User from "./models/User.js"
import connectDb from "./db/connect.js";
import bcrypt from "bcrypt";

const register = async () => {
    try{
        await connectDb();
        const hashPassword = await bcrypt.hash("admin", 10);
        const newUser = new User({
            name: "admin", 
            email: "admin@gmail.com",
            password: hashPassword,
            address: "admin address",
            role: "admin"
        });

        await newUser.save();
        console.log("Admin user created successfully");
    }catch(error){
        console.log(error);
    };
};

register();