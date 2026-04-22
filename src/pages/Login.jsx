// /Users/nheartz/Desktop/Finance/Finance/frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // ยิง API ไปที่ Backend
            const response = await api.post('/users/login', { username, password });
            
            // เก็บ Token ลงใน LocalStorage ของเบราว์เซอร์
            localStorage.setItem('token', response.data.token);
            
            // พาไปหน้าแรกทันที พร้อมกับส่ง state ว่าเพิ่ง Login สำเร็จ
            navigate('/', { state: { loginSuccess: true } });
        } catch (err) {
            setError('Login ไม่สำเร็จ: ตรวจสอบ Username หรือ Password อีกครั้ง');
            console.error(err);
        }
    };

    return (
        <div className="container">
            <div className="card login-card">
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>เข้าสู่ระบบ (Login)</h2>
                {error && <p className="text-danger" style={{ textAlign: 'center' }}>{error}</p>}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                        <label>Username:</label>
                        <input 
                            type="text" 
                            className="input-field"
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input 
                            type="password" 
                            className="input-field"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        เข้าสู่ระบบ
                    </button>
                </form>
            </div>
        </div>
    );
}
