import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Home.css'; // นำเข้าสไตล์ของรายการจาก Home.css มาใช้ซ้ำ
import './Transactions.css';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]); // เก็บ ID หมวดหมู่ที่ถูกติ๊กเลือก
    const [startDate, setStartDate] = useState(''); // เก็บวันที่เริ่มต้น
    const [endDate, setEndDate] = useState(''); // เก็บวันที่สิ้นสุด
    const [filterType, setFilterType] = useState(''); // เก็บประเภท (income/expense/ว่าง=ทั้งหมด)
    const navigate = useNavigate();

    // State สำหรับ Modal ยืนยันการลบ
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    
    // State สำหรับ Toast แจ้งเตือน
    const [toast, setToast] = useState({ show: false, title: '', desc: '', key: 0 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchTransactions();
        fetchCategories();
    }, [navigate]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.show, toast.key]);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions');
            setTransactions(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('ดึงข้อมูลไม่สำเร็จ', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('ดึงข้อมูลหมวดหมู่ไม่สำเร็จ', err);
        }
    };

    const confirmDeleteTransaction = (id) => {
        setTransactionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteTransaction = async () => {
        if (!transactionToDelete) return;
        try {
            await api.delete(`/transactions/${transactionToDelete}`);
            fetchTransactions(); 
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
            setToast({ show: true, title: 'ลบรายการสำเร็จ!', desc: 'รายการธุรกรรมถูกลบออกจากระบบแล้ว', key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการลบรายการ');
            console.error(err);
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setTransactionToDelete(null);
    };

    // ฟังก์ชันจัดการตอนติ๊ก Checkbox
    const toggleCategory = (categoryId) => {
        setSelectedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId) // ถ้ามีอยู่แล้วให้เอาออก
                : [...prev, categoryId] // ถ้ายังไม่มีให้เพิ่มเข้าไป
        );
    };

    // ฟังก์ชันช่วยแปลงวันที่ให้ปลอดภัย ไม่ให้จอขาวถ้ารูปแบบวันที่พัง
    const formatDateSafe = (dateString) => {
        if (!dateString) return 'ไม่ระบุวันที่';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'วันที่ไม่ถูกต้อง';
        return d.toLocaleDateString('th-TH');
    };

    // กรองรายการ Transaction ตามหมวดหมู่ที่ถูกเลือก
    const filteredTransactions = (transactions || []).filter(t => {
        // 1. ตรวจสอบเงื่อนไขหมวดหมู่
        const passCategory = selectedCategories.length === 0 || selectedCategories.includes(t.categoryId);
        
        // 2. ตรวจสอบเงื่อนไขช่วงวันที่
        let passDate = true;
        if (t.date) {
            const tDateObj = new Date(t.date);
            if (!isNaN(tDateObj.getTime())) { // เช็คว่าวันที่ถูกต้องก่อนแปลง
                const tDateString = `${tDateObj.getFullYear()}-${String(tDateObj.getMonth() + 1).padStart(2, '0')}-${String(tDateObj.getDate()).padStart(2, '0')}`;
                if (startDate && tDateString < startDate) passDate = false;
                if (endDate && tDateString > endDate) passDate = false;
            }
        }

        // 3. ตรวจสอบเงื่อนไขประเภท (รายรับ/รายจ่าย)
        const passType = filterType === '' || t.type === filterType;

        return passCategory && passDate && passType;
    });
    
    const clearFilters = () => {
        setSelectedCategories([]);
        setStartDate('');
        setEndDate('');
        setFilterType('');
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

            <div className="transactions-page-header">
                <button onClick={() => navigate('/')} className="btn" style={{ backgroundColor: '#e2e3e5' }}>⬅ กลับหน้าแรก</button>
                <h2 style={{ margin: 0 }}>รายการธุรกรรมทั้งหมด</h2>
            </div>

            {/* กล่องตัวกรอง (Filter) */}
            <div className="card" style={{ marginBottom: '20px', padding: '15px 20px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#555' }}>📌 ตัวกรองข้อมูล</h4>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>🔄 ประเภท:</label>
                        <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px 12px', minWidth: '150px' }}>
                            <option value="">ทั้งหมด</option>
                            <option value="income">เฉพาะรายรับ</option>
                            <option value="expense">เฉพาะรายจ่าย</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>📅 ช่วงวันที่:</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input 
                                type="date" 
                                className="input-field" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                style={{ padding: '6px 12px' }}
                            />
                            <span style={{ color: '#666' }}>ถึง</span>
                            <input 
                                type="date" 
                                className="input-field" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                style={{ padding: '6px 12px' }}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>🏷️ หมวดหมู่:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={selectedCategories.includes(null)}
                                onChange={() => toggleCategory(null)}
                            />
                            <span>ไม่มีหมวดหมู่</span>
                        </label>
                    {(categories || []).map(c => (
                            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedCategories.includes(c.id)}
                                    onChange={() => toggleCategory(c.id)}
                                />
                                <span>{c.icon} {c.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {(selectedCategories.length > 0 || startDate || endDate || filterType) && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <button onClick={clearFilters} className="btn btn-sm" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ล้างตัวกรองทั้งหมด</button>
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {transactions.length === 0 ? (
                    <p className="empty-text" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>ไม่มีข้อมูลธุรกรรมในระบบ</p>
                ) : filteredTransactions.length === 0 ? (
                    <p className="empty-text" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>ไม่พบรายการในหมวดหมู่ที่เลือก</p>
                ) : (
                    <ul className="transaction-list">
                        {filteredTransactions.map(t => {
                            const category = (categories || []).find(c => c.id === t.categoryId);
                            return (
                                <li key={t.id} className="transaction-item" style={{ padding: '15px 20px' }}>
                                    <div className="transaction-info" style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', marginBottom: '5px' }}>{category ? `${category.icon} ${category.name}` : 'ไม่ระบุหมวดหมู่'}</div>
                                        <div style={{ fontSize: '14px', color: '#666' }}>{formatDateSafe(t.date)} - {t.description || 'ไม่มีคำอธิบาย'}</div>
                                    </div>
                                    <div className="transaction-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span className={t.type === 'income' ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold' }}>
                                            {t.type === 'income' ? '+' : '-'}{(t.amount || 0).toLocaleString()} บาท
                                        </span>
                                        <button onClick={() => confirmDeleteTransaction(t.id)} className="btn btn-danger btn-sm">ลบ</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Modal ยืนยันการลบ */}
            {isDeleteModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0, color: '#dc3545' }}>ยืนยันการลบรายการ</h3>
                        <p style={{ color: '#555', marginBottom: '25px' }}>คุณแน่ใจหรือไม่ว่าต้องการลบรายการธุรกรรมนี้?<br/>(ไม่สามารถกู้คืนได้)</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={cancelDelete} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                            <button onClick={executeDeleteTransaction} className="btn btn-danger">ยืนยันการลบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}