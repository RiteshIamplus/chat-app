// src/socket.js
import { io } from "socket.io-client";

// Replace with your backend server URL
const socket = io("http://192.168.1.2:5000"); 

export default socket;
