// /Users/nheartz/Desktop/Finance/Finance/frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import AdminUsers from './pages/AdminUsers';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/admin/users" element={<AdminUsers />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
