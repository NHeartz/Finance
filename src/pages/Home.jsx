// Force new build v3
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import './Home.css';

// รายการไอคอนที่เตรียมไว้ให้เลือก
const PREDEFINED_ICONS = ['🍔', '☕', '🚗', '🏠', '🛒', '💡', '🏥', '🎉', '👗', '📱', '🎮', '💰', '💸', '💼', '🎁', '📌'];

// ฟังก์ชันช่วยดึงวันที่ท้องถิ่น (Local Date) ป้องกันปัญหา Timezone (UTC Shift)
const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const getLocalMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Home() {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [user, setUser] = useState(null);
    
    // State สำหรับฟอร์มเพิ่มรายการ
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense'); // ค่าเริ่มต้นเป็นรายจ่าย
    const [categoryId, setCategoryId] = useState('');
    const [date, setDate] = useState(getLocalDateStr()); // วันที่เริ่มต้นเป็นวันนี้
    
    const currentMonthStr = getLocalMonthStr(); 
    const [filterMonth, setFilterMonth] = useState(currentMonthStr);
    
    // State สำหรับ Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('income'); // 'income' หรือ 'expense'

    // State สำหรับ Modal ยืนยันการลบ
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    
    // State สำหรับ Toast แจ้งเตือน (ใช้ซ้ำได้ทั้ง Login, เพิ่ม, ลบ)
    const [toast, setToast] = useState({ show: false, title: '', desc: '', key: 0 });

    // State สำหรับ Modal เปลี่ยนชื่อ
    const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // State สำหรับ Modal สร้างหมวดหมู่
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('📌');

    // State สำหรับ Modal เปลี่ยนรหัสผ่าน
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        // 1. เช็คก่อนว่ามี Token หรือไม่ ถ้าไม่มีให้เด้งไปหน้า Login ทันที
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // 2. ถ้ามี Token ก็สั่งดึงข้อมูล Transaction และ Category
        fetchTransactions();
        fetchCategories();
        fetchProfile();
        
        // 3. เช็คว่าเพิ่ง Login สำเร็จมาหรือไม่
        if (location.state?.loginSuccess) {
            setToast({ show: true, title: 'เข้าสู่ระบบสำเร็จ!', desc: null, key: Date.now() });
            // ล้าง state ของ location ออก เพื่อไม่ให้แจ้งเตือนซ้ำตอนกด Refresh หน้าเว็บ
            window.history.replaceState({}, document.title);
        }
    }, [navigate, location]);

    // จัดการเวลาของ Toast ให้หายไปเองใน 5 วินาที (และเริ่มใหม่ถ้ามี Toast ใหม่เด้งขึ้นมา)
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.show, toast.key]);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
        } catch (err) {
            console.error('ดึงข้อมูลผู้ใช้ไม่สำเร็จ', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            // ป้องกัน API ส่งข้อมูลที่ไม่ใช่ Array มาให้
            setCategories(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('ดึงข้อมูลหมวดหมู่ไม่สำเร็จ', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions');
            // ป้องกัน API ส่งข้อมูลที่ไม่ใช่ Array มาให้
            setTransactions(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('ดึงข้อมูลไม่สำเร็จ', err);
            if (err.response?.status === 401) {
                // ถ้า Token หมดอายุ หรือไม่ถูกต้อง ให้ลบทิ้งแล้วไปหน้า Login
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transactions', {
                amount: parseFloat(amount),
                description: description,
                type: type,
                categoryId: categoryId ? parseInt(categoryId) : null,
                date: date // ส่งวันที่ไปด้วย
            });
            
            // เคลียร์ฟอร์ม
            setAmount('');
            setDescription('');
            setDate(getLocalDateStr()); // คืนค่ากลับเป็นวันที่ปัจจุบัน
            
            // ดึงข้อมูลรายการอัปเดตใหม่
            fetchTransactions();
            
            // แสดงแจ้งเตือนเพิ่มรายการสำเร็จ
            setToast({ show: true, title: 'บันทึกสำเร็จ!', desc: 'เพิ่มรายการธุรกรรมใหม่เรียบร้อยแล้ว', key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const confirmDeleteTransaction = (id) => {
        setTransactionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteTransaction = async () => {
        if (!transactionToDelete) return;
        try {
            await api.delete(`/transactions/${transactionToDelete}`);
            fetchTransactions(); // ดึงข้อมูลใหม่หลังจากลบเสร็จ (ยอดรวมจะอัปเดตตามด้วย)
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
            
            // แสดงแจ้งเตือนลบรายการสำเร็จ
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

    // ฟังก์ชันช่วยแปลงวันที่ให้ปลอดภัย ไม่ให้จอขาวถ้ารูปแบบวันที่พัง
    const formatDateSafe = (dateString) => {
        if (!dateString) return 'ไม่ระบุวันที่';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'วันที่ไม่ถูกต้อง';
        return d.toLocaleDateString('th-TH');
    };

    // ฟังก์ชันช่วยดึง YYYY-MM จากวันที่อย่างปลอดภัย (ป้องกันจอขาวถ้ารูปแบบ string ผิดเพี้ยน)
    const getMonthYearString = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    // 1. ดึงข้อมูล "ปี" ทั้งหมดที่มีในระบบ (รวมถึงปีปัจจุบัน)
    const availableYears = [...new Set([
        new Date().getFullYear(),
        ...(transactions || []).map(t => t && t.date ? new Date(t.date).getFullYear() : null).filter(y => y !== null && !isNaN(y))
    ])].sort().reverse();

    // สร้างรายการเดือนทั้ง 12 เดือน (ม.ค. - ธ.ค.) สำหรับแต่ละปี
    const availableMonths = [];
    availableYears.forEach(year => {
        for (let month = 1; month <= 12; month++) {
            availableMonths.push(`${year}-${String(month).padStart(2, '0')}`);
        }
    });

    const formatMonthYear = (yyyyMm) => {
        if (!yyyyMm || typeof yyyMm !== 'string' || !yyyyMm.includes('-')) return yyyyMm || 'Unknown';
        const parts = yyyMm.split('-');
        return `${parts[1]}/${parts[0]}`; // แสดงผลเป็น MM/YYYY เช่น 05/2024
    };

    // 2. กรองข้อมูลเฉพาะเดือนที่เลือก (หรือดูทั้งหมดถ้าไม่ได้เลือก)
    const filteredTransactions = (transactions || []).filter(t => {
        if (!t) return false;
        if (!filterMonth) return true;
        const tMonth = getMonthYearString(t.date);
        return tMonth === filterMonth;
    });

    // 3. คำนวณยอดรวมจากข้อมูลที่กรองแล้ว
    const totalIncome = filteredTransactions
        .filter(t => t && t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalExpense = filteredTransactions
        .filter(t => t && t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const balance = totalIncome - totalExpense;

    const openModal = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        try {
            await api.put('/users/me/name', { displayName: newDisplayName });
            setUser({ ...user, displayName: newDisplayName });
            setIsEditNameModalOpen(false);
            
            // แสดงแจ้งเตือน
            setToast({ show: true, title: 'เปลี่ยนชื่อสำเร็จ!', desc: 'อัปเดตชื่อแสดงผลเรียบร้อยแล้ว', key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการเปลี่ยนชื่อ');
            console.error(err);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/change-password', { 
                oldPassword: oldPassword, 
                newPassword: newPassword 
            });
            setIsChangePasswordModalOpen(false);
            setOldPassword('');
            setNewPassword('');
            setToast({ show: true, title: 'เปลี่ยนรหัสผ่านสำเร็จ!', desc: 'รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว', key: Date.now() });
        } catch (err) {
            alert(err.response?.data || 'รหัสผ่านเดิมไม่ถูกต้อง หรือเกิดข้อผิดพลาด');
            console.error(err);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', {
                name: newCategoryName,
                icon: newCategoryIcon
            });
            setNewCategoryName('');
            setNewCategoryIcon('📌');
            setIsCategoryModalOpen(false);
            fetchCategories(); // ดึงหมวดหมู่อัปเดตใหม่
            setToast({ show: true, title: 'สร้างหมวดหมู่สำเร็จ!', desc: `เพิ่มหมวดหมู่ ${newCategoryName} เรียบร้อยแล้ว`, key: Date.now() });
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการสร้างหมวดหมู่');
            console.error(err);
        }
    };

    return (
        <div className="container">
            {/* Toast แจ้งเตือน */}
            {toast.show && (
                <div key={toast.key} className="toast-success">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}> {toast.title}</div>
                        <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="toast-close">✖</button>
                    </div>
                    {toast.desc && <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.9 }}>{toast.desc}</div>}
                    <div className="toast-timer"></div>
                </div>
            )}

            <div className="flex-between" style={{ marginBottom: '15px' }}>
                <h1 style={{ margin: 0 }}>หน้าแรก</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {user && (
                        <span 
                            style={{ cursor: 'pointer', color: '#007bff', fontWeight: '500' }}
                            onClick={() => {
                                setNewDisplayName(user.displayName || user.username);
                                setIsEditNameModalOpen(true);
                            }}
                            title="คลิกเพื่อเปลี่ยนชื่อแสดงผล"
                        >
                            สวัสดี, {user.displayName || user.username} ✏️
                        </span>
                    )}
                    {user && user.role === 'Admin' && (
                        <button onClick={() => navigate('/admin/users')} className="btn btn-sm" style={{ backgroundColor: '#6f42c1', color: 'white' }} title="จัดการผู้ใช้ทั้งหมด">🛡️ จัดการผู้ใช้</button>
                    )}
                    <button onClick={() => setIsChangePasswordModalOpen(true)} className="btn btn-sm" style={{ backgroundColor: '#e2e3e5', color: '#333' }} title="เปลี่ยนรหัสผ่าน">⚙️</button>
                    <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
                </div>
            </div>

            {/* ตัวกรองประจำเดือน */}
            <div className="card" style={{ marginBottom: '15px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: '500', margin: 0, color: '#555' }}>📅 ประจำเดือน:</label>
                <select 
                    className="input-field" 
                    value={filterMonth} 
                    onChange={e => setFilterMonth(e.target.value)} 
                    style={{ padding: '8px 12px', minWidth: '200px' }}
                >
                    <option value="">-- รวมทุกเดือน --</option>
                    {availableMonths.map(month => (
                        <option key={month} value={month}>{formatMonthYear(month)}</option>
                    ))}
                </select>
            </div>

            {/* ส่วนสรุปยอดรวม */}
            <div className="summary-container">
                <div 
                    onClick={() => openModal('income')}
                    className="summary-box box-income clickable"
                    title="คลิกเพื่อดูประวัติรายรับ"
                >
                    <h4>รายรับรวม</h4>
                    <h2>฿{totalIncome.toLocaleString()}</h2>
                </div>
                <div 
                    onClick={() => openModal('expense')}
                    className="summary-box box-expense clickable"
                    title="คลิกเพื่อดูประวัติรายจ่าย"
                >
                    <h4>รายจ่ายรวม</h4>
                    <h2>฿{totalExpense.toLocaleString()}</h2>
                </div>
                <div className="summary-box box-balance">
                    <h4>ยอดคงเหลือ</h4>
                    <h2 className={balance >= 0 ? 'text-success' : 'text-danger'}>฿{balance.toLocaleString()}</h2>
                </div>
            </div>
            
            <div className="card">
                <h3 style={{ marginBottom: '20px' }}>เพิ่มรายการใหม่</h3>
                <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="input-field" value={type} onChange={e => setType(e.target.value)} style={{ flex: 1 }}>
                            <option value="expense">รายจ่าย</option>
                            <option value="income">รายรับ</option>
                        </select>
                        <input 
                            type="date" 
                            className="input-field"
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            required 
                            style={{ flex: 1 }}
                        />
                    </div>
                    
                    <input 
                        type="number" 
                        className="input-field"
                        placeholder="จำนวนเงิน" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        required 
                    />
                    
                    <input 
                        type="text" 
                        className="input-field"
                        placeholder="รายละเอียด (เช่น ค่าอาหาร, เงินเดือน)" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                    />
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ flex: 1 }}>
                            <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                            {(categories || []).map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                        <button type="button" className="btn btn-primary" onClick={() => {
                            setIsCategoryModalOpen(true);
                        }} title="สร้างหมวดหมู่ใหม่">+</button>
                        <button type="button" className="btn" onClick={() => navigate('/categories')} style={{ backgroundColor: '#e2e3e5', color: '#333' }} title="จัดการหมวดหมู่">⚙️</button>
                    </div>
                    
                    <button type="submit" className="btn btn-success">บันทึกรายการ</button>
                </form>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 10px 20px' }}>
                    <h3 style={{ margin: 0 }}>รายการธุรกรรมล่าสุด</h3>
                    {filteredTransactions.length > 5 && (
                        <span 
                            style={{ color: '#007bff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                            onClick={() => navigate('/transactions')}
                        >
                            ดูเพิ่มเติม &gt;
                        </span>
                    )}
                </div>
                {filteredTransactions.length === 0 ? (
                    <p style={{ padding: '0 20px 20px 20px', color: '#666' }}>ไม่มีรายการธุรกรรมในเดือนนี้</p>
                ) : (
                    <ul className="transaction-list">
                        {filteredTransactions.slice(0, 5).map(t => {
                            const category = (categories || []).find(c => c.id === t.categoryId);
                            return (
                                <li key={t.id} className="transaction-item">
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

            {/* Modal แสดงประวัติ */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>ประวัติ{modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}</h2>
                            <button onClick={closeModal} className="btn-close">✖</button>
                        </div>
                        
                        {filteredTransactions.filter(t => t.type === modalType).length === 0 ? (
                            <p className="empty-text" style={{ textAlign: 'center', color: '#666' }}>ไม่มีข้อมูล</p>
                        ) : (
                            <ul className="transaction-list">
                                {filteredTransactions.filter(t => t.type === modalType).map(t => {
                                    const category = (categories || []).find(c => c.id === t.categoryId);
                                    return (
                                        <li key={t.id} className="transaction-item" style={{ padding: '15px 0' }}>
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
                </div>
            )}

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

            {/* Modal เปลี่ยนชื่อ */}
            {isEditNameModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0 }}>เปลี่ยนชื่อแสดงผล</h3>
                        <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <input 
                                type="text" 
                                className="input-field"
                                value={newDisplayName} 
                                onChange={e => setNewDisplayName(e.target.value)} 
                                placeholder="กรอกชื่อที่ต้องการแสดง"
                                required 
                            />
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsEditNameModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal สร้างหมวดหมู่ */}
            {isCategoryModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0 }}>สร้างหมวดหมู่ใหม่</h3>
                        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <input 
                                type="text" 
                                className="input-field"
                                value={newCategoryName} 
                                onChange={e => setNewCategoryName(e.target.value)} 
                                placeholder="ชื่อหมวดหมู่ (เช่น ค่ากาแฟ, เงินเดือน)"
                                required 
                            />
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
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-success">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal เปลี่ยนรหัสผ่าน */}
            {isChangePasswordModalOpen && (
                <div className="modal-overlay delete-modal">
                    <div className="modal-content small">
                        <h3 style={{ marginTop: 0 }}>เปลี่ยนรหัสผ่าน</h3>
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#555' }}>รหัสผ่านเดิม:</label>
                                <input 
                                    type="password" 
                                    className="input-field"
                                    value={oldPassword} 
                                    onChange={e => setOldPassword(e.target.value)} 
                                    placeholder="กรอกรหัสผ่านเดิม"
                                    required 
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#555' }}>รหัสผ่านใหม่:</label>
                                <input 
                                    type="password" 
                                    className="input-field"
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    placeholder="กรอกรหัสผ่านใหม่"
                                    required 
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsChangePasswordModalOpen(false)} className="btn" style={{ backgroundColor: '#e2e3e5', color: '#333' }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary">บันทึกรหัสผ่าน</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}