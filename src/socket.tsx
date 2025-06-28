// src/socket.js
import { io } from "socket.io-client";
import { BASE_URL } from "./lib/baseUrl";

// Replace with your backend server URL
const socket = io(BASE_URL, {
    withCredentials: true,
  }); 

export default socket;
