'use client'

import { UserWithRole } from '@/lib/auth/roles'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/admin/users')
                const data = await response.json()
                setUsers(data.users)
            } catch (error) {
                console.error('Error fetching users:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
            <p className="text-white/60 mb-8">Gestion complète de la plateforme</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white/40 text-sm">Utilisateurs</h3>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white/40 text-sm">Rôles</h3>
                    <p className="text-2xl font-bold text-white">ADMIN / ANALYST / USER</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white/40 text-sm">Statut</h3>
                    <p className="text-2xl font-bold text-green-400">✅ Opérationnel</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Gestion des utilisateurs</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-white/40 border-b border-white/10">
                                <th className="text-left py-3 px-4">Nom</th>
                                <th className="text-left py-3 px-4">Email</th>
                                <th className="text-left py-3 px-4">Rôle</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: any) => (
                                <tr key={user.id} className="border-b border-white/5">
                                    <td className="py-3 px-4 text-white">{user.full_name}</td>
                                    <td className="py-3 px-4 text-white/60">{user.email}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button className="text-blue-400 hover:text-blue-300 text-xs">Modifier</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}