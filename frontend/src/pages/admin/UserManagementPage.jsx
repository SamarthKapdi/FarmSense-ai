import React, { useState, useEffect } from 'react';
import { getAllUsers, disableUser, enableUser } from '../../services/adminApi';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleToggleStatus = async (user) => {
        try {
            if (user.enabled !== false) {
                await disableUser(user.id);
            } else {
                await enableUser(user.id);
            }
            loadUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredUsers = users.filter(u => {
        if (filterRole !== 'ALL' && u.role !== filterRole) return false;
        const q = search.toLowerCase();
        return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Manage farmers, agronomists, and system access.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-semibold hover:bg-[var(--hover-bg)] transition-colors">
                        Export CSV
                    </button>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-sm">
                        + Add Expert
                    </button>
                </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4 bg-[var(--bg-main)]">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
                        <input 
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-[var(--text-primary)]"
                        />
                    </div>
                    <select 
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="ROLE_FARMER">Farmers</option>
                        <option value="ROLE_AGRONOMIST">Agronomists</option>
                        <option value="ROLE_ADMIN">Admins</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--hover-bg)] text-[var(--text-secondary)]">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">No users found.</td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[var(--text-primary)]">{user.fullName}</span>
                                            <span className="text-xs text-[var(--text-muted)]">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            user.role === 'ROLE_ADMIN' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                                            user.role === 'ROLE_AGRONOMIST' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                            'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        }`}>
                                            {user.role.replace('ROLE_', '')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.enabled !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.enabled !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {user.enabled !== false ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors">View</button>
                                        {user.role !== 'ROLE_ADMIN' && (
                                            <button 
                                                onClick={() => handleToggleStatus(user)}
                                                className={`font-medium transition-colors ${user.enabled !== false ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-500'}`}
                                            >
                                                {user.enabled !== false ? 'Disable' : 'Enable'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
