import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { Shield, User as UserIcon } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { allUsers, updateUserRole, user: currentUser } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {t('users.adminAccess')}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <p className="text-sm text-gray-500">
            {t('users.desc')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">{t('users.user')}</th>
                <th className="px-6 py-3">{t('users.email')}</th>
                <th className="px-6 py-3">{t('users.role')}</th>
                <th className="px-6 py-3">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{u.name}</span>
                      {u.id === currentUser?.id && <span className="text-xs text-gray-500">(You)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                        u.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                      disabled={u.id === currentUser?.id} // Prevent changing own role
                      className="block w-full max-w-[140px] pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value={UserRole.SALES}>Sales</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};