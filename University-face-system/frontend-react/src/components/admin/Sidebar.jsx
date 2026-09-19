import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Settings, Home, LogOut, Camera, ScanFace, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        { path: '/admin/dashboard', icon: Home, label: 'Bảng Điều Khiển' },
        { path: '/admin/users', icon: Users, label: 'Quản Lý Người Dùng' },
        { path: '/admin/face-registration-demo', icon: Camera, label: 'Đăng Ký Khuôn Mặt' },
        { path: '/admin/admin-face-registration', icon: Shield, label: 'KM Admin/Giảng Viên' },
        { path: '/admin/face-recognition', icon: ScanFace, label: 'Nhận Diện Khuôn Mặt' },
        { path: '/admin/settings', icon: Settings, label: 'Cài Đặt' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                    F
                </div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">FaceSystem</h2>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 mt-2">Menu chính</p>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium ${
                                    isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={20} className={isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'} />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
            
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium group"
                >
                    <LogOut size={20} className="text-red-500 group-hover:text-red-600" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
