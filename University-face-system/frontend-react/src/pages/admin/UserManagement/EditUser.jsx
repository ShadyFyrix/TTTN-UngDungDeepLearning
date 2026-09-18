import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userService } from '../../../services/user.service';

const EditUser = ({ isOpen, onClose, onUserUpdated, user }) => {
    const [formData, setFormData] = useState({
        email: '', password: '', full_name: '', username: '', role: 'user'
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                password: '', // Leave empty unless changing
                full_name: user.full_name || '',
                username: user.username || '',
                role: user.role || 'user'
            });
            setFormError('');
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        
        try {
            const updateData = { ...formData };
            if (!updateData.password) delete updateData.password;
            
            await userService.updateUser(user.id, updateData);
            onUserUpdated(); // Refresh list
            onClose(); // Close modal
        } catch (error) {
            setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa người dùng</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {formError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                        <input 
                            type="email" required
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ tên</label>
                            <input 
                                type="text"
                                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                            <input 
                                type="text"
                                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vai trò</label>
                        <select 
                            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Mật khẩu <span className="text-gray-400 font-normal">(để trống nếu không đổi)</span>
                        </label>
                        <input 
                            type="password"
                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white font-medium hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUser;
