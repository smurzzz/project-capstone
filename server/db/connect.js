import mongoose from "mongoose";
 
const connectDb = async () => {
    try{
        await mongoose.connect(process.env.URI);
        console.log("Connection success");
    }catch(error){
        console.error("Connection failed", error.message);
        process.exit(1);
    };
};

export default connectDb    