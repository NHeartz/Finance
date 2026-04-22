// /Users/nheartz/Desktop/Finance/Finance/frontend/src/api/axios.js
import axios from 'axios';

// ตั้งค่า URL เริ่มต้นให้ชี้ไปที่ Backend ของเรา
const api = axios.create({
    // ใช้ตัวแปร VITE_API_URL จาก Vercel ถ้าไม่มีให้ตกกลับมาใช้ localhost สำหรับรันในเครื่อง
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5066/api',
});

// ดักจับทุกๆ Request ก่อนส่งออกไป เพื่อแนบ Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
