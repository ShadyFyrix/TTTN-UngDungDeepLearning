import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { userService } from '../../../services/user.service';

const DeleteUser = ({ isOpen, onClose, onUserDeleted, user }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !user) return null;

    const handleDelete = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await userService.deleteUser(user.id);
            onUserDeleted(); // Refresh list
            onClose(); // Close modal
        } catch (error) {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} />
                        Xóa người dùng
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}
                    <p className="text-gray-600">
                        Bạn có chắc chắn muốn xóa người dùng <strong className="text-gray-900">{user.email}</strong>? Hành động này không thể hoàn tác.
                    </p>
                    
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="button" onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Đang xóa...' : 'Đồng ý xóa'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteUser;
