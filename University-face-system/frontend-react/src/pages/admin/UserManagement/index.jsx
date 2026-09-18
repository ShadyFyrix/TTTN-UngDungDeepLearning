import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { userService } from '../../../services/user.service';
import CreateUser from './CreateUser';
import EditUser from './EditUser';
import DeleteUser from './DeleteUser';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUsers = useCallback(async (page = pagination.page, searchTerm = search) => {
        setLoading(true);
        try {
            const result = await userService.getAllUsers(page, pagination.limit, searchTerm);
            setUsers(result.data);
            setPagination(result.pagination);
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng", error);
        }
        setLoading(false);
    }, [pagination.limit]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(1, search);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUsers(newPage);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setIsEditOpen(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
                    <p className="text-gray-500 mt-1">Quản lý tài khoản và phân quyền hệ thống</p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm người dùng</span>
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <form onSubmit={handleSearch} className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm theo email, tên..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                        />
                    </form>
                    <div className="text-sm text-gray-500 font-medium">
                        Tổng số: {pagination.total}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Người dùng</th>
                                <th className="p-4 font-semibold">Username</th>
                                <th className="p-4 font-semibold">Vai trò</th>
                                <th className="p-4 font-semibold">Trạng thái</th>
                                <th className="p-4 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                            Đang tải...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">
                                        Không tìm thấy dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{u.full_name || 'Chưa cập nhật'}</div>
                                                    <div className="text-sm text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium">{u.username || '-'}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                                                ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {u.is_email_verified ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã xác thực
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-amber-500 text-sm font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Chờ xác thực
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(u)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => openDeleteModal(u)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Trang <span className="font-semibold text-gray-900">{pagination.page}</span> / {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Render sub-views */}
            <CreateUser 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onUserCreated={() => fetchUsers(1)} 
            />
            
            <EditUser 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                onUserUpdated={() => fetchUsers()} 
                user={selectedUser} 
            />
            
            <DeleteUser 
                isOpen={isDeleteOpen} 
                onClose={() => setIsDeleteOpen(false)} 
                onUserDeleted={() => {
                    const willBeEmpty = users.length === 1 && pagination.page > 1;
                    fetchUsers(willBeEmpty ? pagination.page - 1 : pagination.page);
                }} 
                user={selectedUser} 
            />
        </div>
    );
};

export default UserManagement;
