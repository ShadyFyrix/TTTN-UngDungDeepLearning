import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, Clock, CheckCircle, AlertCircle, CalendarRange } from 'lucide-react';
import api from '../../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Không thể tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
        );
    }

    const statCards = [
        { title: 'Tổng Sinh Viên', value: stats?.counts.students || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Tổng Môn Học', value: stats?.counts.courses || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Lịch Học', value: stats?.counts.classes || 0, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { title: 'Lịch Thi', value: stats?.counts.exams || 0, icon: CalendarRange, color: 'text-orange-600', bg: 'bg-orange-100' }
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
                <p className="text-gray-500 mt-1">Dữ liệu thống kê tổng quát về quản lý sinh viên và điểm danh</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg}`}>
                                <Icon size={28} className={card.color} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                <h3 className="text-3xl font-bold text-gray-800 mt-1">{card.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Lịch sử điểm danh Lớp */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-primary-600" />
                            <h2 className="text-lg font-bold text-gray-800">Điểm danh Lớp học gần đây</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                                    <th className="p-4 font-medium">Thời gian</th>
                                    <th className="p-4 font-medium">Sinh viên</th>
                                    <th className="p-4 font-medium">Môn / Phòng</th>
                                    <th className="p-4 font-medium text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentActivity.classes.length > 0 ? (
                                    stats.recentActivity.classes.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 text-sm text-gray-600">{formatDate(log.check_in_time)}</td>
                                            <td className="p-4">
                                                <p className="font-semibold text-gray-800 text-sm">{log.full_name}</p>
                                                <p className="text-xs text-gray-500">{log.student_code}</p>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                <p className="font-medium">{log.course_name}</p>
                                                <p className="text-xs text-gray-500">{log.room_name}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle size={12} />
                                                    Thành công
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            Chưa có dữ liệu điểm danh lớp học
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lịch sử điểm danh Thi */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/30">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-orange-600" />
                            <h2 className="text-lg font-bold text-gray-800">Điểm danh Thi gần đây</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                                    <th className="p-4 font-medium">Thời gian</th>
                                    <th className="p-4 font-medium">Sinh viên</th>
                                    <th className="p-4 font-medium">Môn / Phòng</th>
                                    <th className="p-4 font-medium text-center">Xác thực</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentActivity.exams.length > 0 ? (
                                    stats.recentActivity.exams.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 text-sm text-gray-600">{formatDate(log.check_in_time)}</td>
                                            <td className="p-4">
                                                <p className="font-semibold text-gray-800 text-sm">{log.full_name}</p>
                                                <p className="text-xs text-gray-500">{log.student_code}</p>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                <p className="font-medium">{log.course_name}</p>
                                                <p className="text-xs text-gray-500">{log.exam_room}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                {log.is_verified ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Hợp lệ
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                        <AlertCircle size={12} /> Cảnh báo
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            Chưa có dữ liệu điểm danh thi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
