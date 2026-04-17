import { useState } from "react";
import { MdLockOutline } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post("http://localhost:3000/api/auth/login", {
                email, password});
            if (response.data.success) {
                await login(response.data.user, response.data.token)
                if(response.data.user.role === "admin") {
                    window.location.href = "/admin/dashboard";
                } else {
                    navigate("/customer/dashboard");
                }
            }else {
                alert(response.data.message);
            }
            console.log(response.data);

            const data = await response.json();
            localStorage.setItem("pos-user", JSON.stringify(data.user));
            localStorage.setItem("pos-token", data.token);
            window.location.href = "/admin/dashboard";
        } catch (error) {
            if(error.response){
                setError(error.response.data.message);
            }
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4" >
        <div className="w-md bg-white rounded-lg shadow-md p-4">
           <div className="flex justify-center items-center flex-col gap-y-3">
                <div className="p-3 bg-gray-300 rounded-full shadow-md">
                    <MdLockOutline  size={20} />
                </div>
                <p className="text-xl font-semibold">Admin Access</p>
                <p className="text-gray-500 text-sm">Enter your crendetials to access the admin dashboard</p>
            </div> 

            {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded-md mt-4">
                    {error}
                </div>
            )}
            <form className="mt-6 flex flex-col gap-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-y-2">
                <label className="text-sm font-semibold" htmlFor="email">Email</label>
                <input 
                type="text" 
                id="email" 
                name="email" 
                placeholder="admin@gmail.com"
                className="text-[13px] w-full p-2 text-sm rounded-md outline-0 shadow-sm bg-gray-100"
                required
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-y-2">
                <label className="text-sm font-semibold" htmlFor="password">Password</label>
                <input 
                type="password" 
                id="password" 
                name="password" 
                required
                className="text-[13px] w-full p-2 text-sm rounded-md outline-0 shadow-sm bg-gray-100"
                placeholder="********"
                onChange={(e) => setPassword(e.target.value)}
                 />
            </div>

            <button type="submit" className="w-full text-white p-2 bg-black text-[13px] font-semibold shadow-sm rounded-md cursor-pointer">{loading ? "Signing in..." : "Sign in"} </button>
        </form> 
        </div>  
    </div>
  )
}


export default Login