import axios from "axios";

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : "/api" 
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  if (userInfo?.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
});

// User APIs
export const registerUser = (data) => API.post("/users/register", data);
export const loginUser = (data) => API.post("/users/login", data);
export const searchUsers = (search) => API.get(`/users?search=${search}`);
export const updateProfile = (data) => API.put("/users/profile", data);

// Chat APIs
export const accessChat = (userId) => API.post("/chats", { userId });
export const fetchChats = () => API.get("/chats");
export const createGroupChat = (data) => API.post("/chats/group", data);
export const renameGroup = (data) => API.put("/chats/rename", data);
export const addToGroup = (data) => API.put("/chats/groupadd", data);
export const removeFromGroup = (data) => API.put("/chats/groupremove", data);

// Message APIs
export const sendMessage = (data) => API.post("/messages", data);
export const getMessages = (chatId) => API.get(`/messages/${chatId}`);

export default API;
