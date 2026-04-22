import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Home.css';
import './Categories.css';

const PREDEFINED_ICONS = ['🍔', '☕', '🚗', '🏠', '🛒', '💡', '🏥', '🎉', '👗', '📱', '🎮', '💰', '💸', '💼', '🎁', '📌'];

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('📌');

    const [toast, setToast] = useState({ show: false, title: '', desc: '', key: 0 });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.show, toast.key]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        }
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setEditName(category.name);
        setEditIcon(category.icon || '📌');
        setIsEditModalOpen(true);
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/categories/${editingCategory.id}`, { name: editName, icon: editIcon });
            setIsEditModalOpen(false);
            fetchCategories();
            setToast({ show: true, title: 'แก้ไขสำเร็จ!', desc: `อัปเดตหมวดหมู่เรียบร้อยแล้ว`, key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่');
        }
    };

    const confirmDelete = (id) => {
        setCategoryToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await api.delete(`/categories/${categoryToDelete}`);
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
            fetchCategories();
            setToast({ show: true, title: 'ลบสำเร็จ!', desc: `ลบหมวดหมู่เรียบร้อยแล้ว`, key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการลบหมวดหมู่');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', { name: newCategoryName, icon: newCategoryIcon });
            setIsCreateModalOpen(false);
            setNewCategoryName('');
            setNewCategoryIcon('📌');
            fetchCategories();
            setToast({ show: true, title: 'สร้างสำเร็จ!', desc: `เพิ่มหมวดหมู่เรียบร้อยแล้ว`, key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการสร้างหมวดหมู่');
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
                    <h2 style={{ margin: 0 }}>จัดการหมวดหมู่</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-success">+ สร้างหมวดหมู่</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {categories.length === 0 ? (
                    <p className="category-empty-state">ยังไม่มีหมวดหมู่ในระบบ</p>
                ) : (
                    <ul className="transaction-list">
                        {categories.map(c => (
                            <li key={c.id} className="transaction-item">
                                <div className="category-item-info">
                                    <span>{c.icon}</span>
                                    <span>{c.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => openEditModal(c)} className="btn btn-primary btn-sm">แก้ไข</button>
                                    <button onClick={() => confirmDelete(c.id)} className="btn btn-danger btn-sm">ลบ</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Modal สร้างหมวดหมู่ */}
            {isCreateModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0 }}>สร้างหมวดหมู่ใหม่</h3>
                        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <input type="text" className="input-field" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="ชื่อหมวดหมู่ (เช่น ค่ากาแฟ)" required />
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: '500' }}>เลือกไอคอน:</label>
                                <div className="icon-selector">
                                    {PREDEFINED_ICONS.map(icon => (
                                        <div key={icon} className={`icon-item ${newCategoryIcon === icon ? 'selected' : ''}`} onClick={() => setNewCategoryIcon(icon)}>
                                            {icon}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-success">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal แก้ไข */}
            {isEditModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0 }}>แก้ไขหมวดหมู่</h3>
                        <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <input type="text" className="input-field" value={editName} onChange={e => setEditName(e.target.value)} required />
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: '500' }}>เลือกไอคอน:</label>
                                <div className="icon-selector">
                                    {PREDEFINED_ICONS.map(icon => (
                                        <div key={icon} className={`icon-item ${editIcon === icon ? 'selected' : ''}`} onClick={() => setEditIcon(icon)}>
                                            {icon}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal ยืนยันการลบ */}
            {isDeleteModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0, color: '#dc3545' }}>ยืนยันการลบ</h3>
                        <p style={{ color: '#555', marginBottom: '25px' }}>คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?<br/>(รายการธุรกรรมเก่าที่ใช้หมวดหมู่นี้จะไม่หายไป แต่จะกลายเป็นไม่ระบุหมวดหมู่)</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                            <button onClick={executeDelete} className="btn btn-danger">ยืนยันลบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}