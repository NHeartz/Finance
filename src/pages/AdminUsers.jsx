import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Home.css';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('User');

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const [toast, setToast] = useState({ show: false, title: '', desc: '', key: 0 });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.show, toast.key]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็น Admin)');
                navigate('/');
            }
        }
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'Admin' ? 'User' : 'Admin';
        if (!window.confirm(`คุณต้องการเปลี่ยนสิทธิ์ผู้ใช้นี้เป็น ${newRole} หรือไม่?`)) return;
        
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            fetchUsers();
            setToast({ show: true, title: 'เปลี่ยนสิทธิ์สำเร็จ!', desc: `ผู้ใช้ได้รับการเปลี่ยนสิทธิ์เป็น ${newRole} แล้ว`, key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/admin-create', { username: newUsername, password: newPassword, role: newRole });
            setIsCreateModalOpen(false);
            setNewUsername('');
            setNewPassword('');
            setNewRole('User');
            fetchUsers();
            setToast({ show: true, title: 'เพิ่มผู้ใช้สำเร็จ!', desc: `บัญชี ${newUsername} ถูกสร้างเรียบร้อยแล้ว`, key: Date.now() });
        } catch (err) {
            alert(err.response?.data || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
            console.error(err);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/admin-reset-password', { userId: userToReset.id, newPassword });
            setIsResetModalOpen(false);
            setNewPassword('');
            setUserToReset(null);
            setToast({ show: true, title: 'รีเซ็ตรหัสผ่านสำเร็จ!', desc: `รหัสผ่านใหม่ถูกตั้งค่าเรียบร้อยแล้ว`, key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
        }
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete.id}`);
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            fetchUsers();
            setToast({ show: true, title: 'ลบผู้ใช้สำเร็จ!', desc: `บัญชีถูกลบออกจากระบบแล้ว`, key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
        }
    };

    return (
        <div className="container">
            {toast.show && (
                <div key={toast.key} className="toast-success">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>✅ {toast.title}</div>
                        <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="toast-close">✖</button>
                    </div>
                    {toast.desc && <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.9 }}>{toast.desc}</div>}
                    <div className="toast-timer"></div>
                </div>
            )}

            <div className="flex-between" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/')} className="btn" style={{ backgroundColor: '#e2e3e5' }}>⬅ กลับหน้าแรก</button>
                    <h2 style={{ margin: 0 }}>🛡️ ระบบจัดการผู้ใช้ (Admin)</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-success">+ เพิ่มผู้ใช้</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <ul className="transaction-list">
                    {users.map(u => (
                        <li key={u.id} className="transaction-item">
                            <div className="transaction-info" style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', fontSize: '18px' }}>{u.displayName || u.username}</div>
                                <div style={{ fontSize: '14px', color: '#666' }}>Username: {u.username} | Role: <strong style={{ color: u.role === 'Admin' ? '#6f42c1' : '#555' }}>{u.role}</strong></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleRoleChange(u.id, u.role)} className="btn btn-sm" style={{ backgroundColor: '#e2e3e5' }}>สลับ Role</button>
                                <button onClick={() => { setUserToReset(u); setIsResetModalOpen(true); }} className="btn btn-primary btn-sm">รีเซ็ตรหัส</button>
                                <button onClick={() => { setUserToDelete(u); setIsDeleteModalOpen(true); }} className="btn btn-danger btn-sm">ลบ</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Modal เพิ่มผู้ใช้ใหม่ */}
            {isCreateModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0 }}>เพิ่มผู้ใช้ใหม่</h3>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#555' }}>Username:</label>
                                <input type="text" className="input-field" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="กรอกชื่อผู้ใช้" required style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#555' }}>Password:</label>
                                <input type="text" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="กรอกรหัสผ่าน" required style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#555' }}>Role (สิทธิ์):</label>
                                <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%' }}>
                                    <option value="User">User (ผู้ใช้ทั่วไป)</option>
                                    <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-success">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal รีเซ็ตรหัสผ่าน */}
            {isResetModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0 }}>ตั้งรหัสผ่านใหม่</h3>
                        <p style={{ fontSize: '14px', color: '#555' }}>ตั้งรหัสผ่านใหม่ให้กับผู้ใช้: <strong>{userToReset?.username}</strong></p>
                        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <input type="text" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="กรอกรหัสผ่านใหม่" required />
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsResetModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5' }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary">ยืนยัน</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal ยืนยันการลบ */}
            {isDeleteModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0, color: '#dc3545' }}>ยืนยันการลบบัญชี</h3>
                        <p style={{ color: '#555', marginBottom: '25px' }}>ต้องการลบบัญชี <strong>{userToDelete?.username}</strong> ถาวรหรือไม่?<br/>(รายการธุรกรรมทั้งหมดของเขาก็จะถูกลบด้วย)</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5' }}>ยกเลิก</button>
                            <button onClick={executeDelete} className="btn btn-danger">ยืนยันลบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}