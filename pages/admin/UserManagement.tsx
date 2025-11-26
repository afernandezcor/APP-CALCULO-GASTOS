
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole, User } from '../../types';
import { Shield, User as UserIcon, Trash2, AlertTriangle, Check, X, Info, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { SwipeableItem } from '../../components/SwipeableItem';

export const UserManagement: React.FC = () => {
  const { allUsers, updateUserRole, deleteUser, resolveProfileUpdate, user: currentUser } = useAuth();
  const { deleteExpensesByUserId } = useExpenses();
  const { t } = useLanguage();
  
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // State to track which password to show
  const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(null);

  const handleDeleteClick = (user: User) => {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (userToDelete) {
          deleteExpensesByUserId(userToDelete.id);
          deleteUser(userToDelete.id);
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
      }
  };

  const cancelDelete = () => {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
  };
  
  const togglePassword = (userId: string) => {
      if (visiblePasswordId === userId) {
          setVisiblePasswordId(null);
      } else {
          setVisiblePasswordId(userId);
      }
  };

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
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">{t('users.user')}</th>
                <th className="px-6 py-3">{t('users.email')}</th>
                <th className="px-6 py-3">{t('users.password')}</th>
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
                      <div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                        {u.id === currentUser?.id && <span className="ml-1 text-xs text-gray-500">(You)</span>}
                        {u.pendingUpdates && (
                            <div className="text-xs text-yellow-600 font-medium flex items-center gap-1 mt-1">
                                <Info className="h-3 w-3" />
                                {t('users.requested')}: {u.pendingUpdates.name}
                            </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                      <div>{u.email}</div>
                      {u.pendingUpdates && (
                            <div className="text-xs text-yellow-600 font-medium mt-1">
                                {t('users.requested')}: {u.pendingUpdates.email}
                            </div>
                        )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                              {visiblePasswordId === u.id ? u.password : '••••••'}
                          </span>
                          <button 
                            onClick={() => togglePassword(u.id)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                              {visiblePasswordId === u.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                        u.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {u.pendingUpdates ? (
                         <div className="flex items-center gap-2">
                            <button
                                onClick={() => resolveProfileUpdate(u.id, true)}
                                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                title={t('users.approveChange')}
                            >
                                <Check className="h-4 w-4" />
                            </button>
                             <button
                                onClick={() => resolveProfileUpdate(u.id, false)}
                                className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                title={t('users.rejectChange')}
                            >
                                <X className="h-4 w-4" />
                            </button>
                         </div>
                    ) : (
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
                    )}
                    
                    {u.id !== currentUser?.id && (
                        <button 
                            onClick={() => handleDeleteClick(u)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title={t('action.delete')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View with Swipe */}
        <div className="md:hidden">
            {allUsers.map((u) => (
                <SwipeableItem 
                    key={u.id}
                    onSwipe={() => u.id !== currentUser?.id && handleDeleteClick(u)}
                >
                     <div className="flex items-center gap-3 w-full">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 truncate">
                                  {u.name} {u.id === currentUser?.id && <span className="text-xs text-gray-500">(You)</span>}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                                ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                                  u.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800' : 
                                  'bg-green-100 text-green-800'}`}>
                                {u.role.toUpperCase()}
                              </span>
                          </div>
                          
                          {u.pendingUpdates ? (
                               <div className="mt-1 bg-yellow-50 p-2 rounded text-xs border border-yellow-100">
                                   <p className="font-semibold text-yellow-800 mb-1">{t('users.pendingChanges')}</p>
                                   <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            className="px-2 py-0.5 h-auto text-[10px] bg-green-600 hover:bg-green-700"
                                            onClick={(e) => { e.stopPropagation(); resolveProfileUpdate(u.id, true); }}
                                        >
                                            {t('users.approveChange')}
                                        </Button>
                                         <Button 
                                            size="sm" 
                                            variant="danger"
                                            className="px-2 py-0.5 h-auto text-[10px]"
                                            onClick={(e) => { e.stopPropagation(); resolveProfileUpdate(u.id, false); }}
                                        >
                                            {t('users.rejectChange')}
                                        </Button>
                                   </div>
                               </div>
                          ) : (
                                <div className="text-xs text-gray-500">
                                    <p className="truncate">{u.email}</p>
                                    <div className="flex items-center gap-1 mt-1 text-gray-400">
                                        <span>PW:</span>
                                        <span className="font-mono">
                                            {visiblePasswordId === u.id ? u.password : '••••••'}
                                        </span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePassword(u.id);
                                            }}
                                            className="ml-1 p-1 hover:text-gray-600"
                                        >
                                            {visiblePasswordId === u.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                          )}
                          
                          <div className="mt-2">
                             {!u.pendingUpdates && (
                                <select
                                    value={u.role}
                                    onChange={(e) => {
                                        e.stopPropagation(); // Prevent click-through or conflicts
                                        updateUserRole(u.id, e.target.value as UserRole);
                                    }}
                                    disabled={u.id === currentUser?.id}
                                    className="block w-full py-1 pl-2 pr-8 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value={UserRole.SALES}>Sales</option>
                                    <option value={UserRole.MANAGER}>Manager</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                </select>
                             )}
                          </div>
                      </div>
                    </div>
                </SwipeableItem>
            ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title={t('users.deleteTitle')}
      >
        <div className="flex flex-col items-center text-center space-y-4 p-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t('users.deleteTitle')}?</h3>
            <p className="text-gray-500 text-sm max-w-xs">
                {t('users.deleteConfirm')} <strong>{userToDelete?.name}</strong>
            </p>
            <div className="flex gap-3 w-full mt-4">
                <Button 
                    variant="danger" 
                    className="flex-1 bg-red-600 hover:bg-red-700 border-transparent text-white"
                    onClick={confirmDelete}
                >
                    Yes, Delete
                </Button>
                <Button 
                    variant="secondary" 
                    className="flex-1"
                    onClick={cancelDelete}
                >
                    No, Cancel
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
