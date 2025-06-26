import  { useState } from "react";

import API from "@/lib/axios";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const [phone_number, setphone_number] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("send"); // 'send' or 'verify'
  const [message, setMessage] = useState("");
  const [viewOTP, setviewOTP] = useState("");
const userString = localStorage.getItem("user");
const user = userString ? JSON.parse(userString) : null;
console.log(user);

  const sendOTP = async () => {
    try {
      const res = await API.post("/api/auth/register", { phone_number });
      setMessage(res.data.message);
      setviewOTP(res?.data?.smsSent)
      setStep("verify");
    } catch (err:any) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const verifyOTP = async () => {
    try {
      const res = await API.post("/api/auth/verifyOtp", { phone_number, otp });
      setMessage(res.data.message);

      localStorage.setItem("user", JSON.stringify(res.data.user));
      setStep("done");
      navigate("/chatlist"); // ✅ Redirect to chatlist
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Invalid OTP");
    }
  };
  console.log(message)

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg  w-full ">
        <h1 className="text-2xl font-bold text-center mb-4">Login</h1>

        {step === "send" && (
          <>
            <input
              type="text"
              placeholder="Enter phone_number (e.g. +91XXXXXXXXXX)"
              value={phone_number}
              onChange={(e) => setphone_number(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <button
              onClick={sendOTP}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Send OTP
            </button>
          </>
        )}

        {step === "verify" && (
          <>
          <h2>OTP : {viewOTP}</h2>
            <p className="mb-2 text-sm text-gray-600">OTP sent to {phone_number}</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <button
              onClick={verifyOTP}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Verify OTP
            </button>
          </>
        )}

        {step === "done" && (
          <p className="text-green-600 text-center font-semibold">OTP Verified Successfully 🎉</p>
        )}

        {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
