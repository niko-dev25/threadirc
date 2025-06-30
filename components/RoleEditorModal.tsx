import React, { useState } from 'react';
import { User, Role, Permission } from '../types';

interface RoleEditorModalProps {
    user: User;
    roles: Role[];
    canManageRoles: boolean;
    onClose: () => void;
    onSaveRole: (userId: string, roleId: string) => void;
    onCreateRole: (role: Omit<Role, 'id'>) => void;
}

const ALL_PERMISSIONS: { id: Permission; description: string }[] = [
    { id: 'assign_roles', description: 'Can assign roles to users' },
    { id: 'manage_roles', description: 'Can create and edit custom roles' },
    { id: 'create_infinite_channels', description: 'Can bypass the 4 channel limit' },
    { id: 'delete_any_thread', description: 'Can delete threads (OPs)' },
    { id: 'delete_any_post', description: 'Can delete comments' },
];

const RoleEditorModal: React.FC<RoleEditorModalProps> = ({ user, roles, canManageRoles, onClose, onSaveRole, onCreateRole }) => {
    const [selectedRoleId, setSelectedRoleId] = useState(user.roleId);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    
    // State for new role form
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleStyle, setNewRoleStyle] = useState('text-gray-300');
    const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        setNewRolePermissions(prev => 
            checked ? [...prev, permission] : prev.filter(p => p !== permission)
        );
    };

    const handleCreateNewRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRoleName.trim()) {
            onCreateRole({
                name: newRoleName.trim(),
                style: newRoleStyle,
                permissions: newRolePermissions
            });
            setNewRoleName('');
            setNewRoleStyle('text-gray-300');
            setNewRolePermissions([]);
            setIsCreatingRole(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-mono">
            <div className="bg-gray-800 text-gray-300 border border-gray-700 rounded-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-green-400 mb-4">Edit Role for <span className="text-white">{user.username}</span></h2>
                
                {/* Assign Existing Role */}
                <div className="mb-6">
                    <label htmlFor="role-select" className="block text-sm font-bold text-gray-400 mb-2">Assign Role</label>
                    <select
                        id="role-select"
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>

                {/* Create New Role Section */}
                {canManageRoles && (
                    <div className="border-t border-gray-700 pt-4">
                        <button onClick={() => setIsCreatingRole(c => !c)} className="text-blue-400 hover:underline text-sm mb-4">
                            {isCreatingRole ? 'Cancel Role Creation' : 'Create New Role'}
                        </button>

                        {isCreatingRole && (
                            <form onSubmit={handleCreateNewRole} className="space-y-4 bg-gray-900 p-4 rounded-md">
                                <h3 className="text-lg font-semibold text-gray-200">New Custom Role</h3>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 block mb-1">Role Name</label>
                                    <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="w-full bg-gray-800 p-2 rounded border border-gray-600"/>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 block mb-1">Style (Tailwind Class)</label>
                                    <input type="text" value={newRoleStyle} onChange={e => setNewRoleStyle(e.target.value)} className="w-full bg-gray-800 p-2 rounded border border-gray-600"/>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 block mb-2">Permissions</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ALL_PERMISSIONS.map(p => (
                                            <label key={p.id} className="flex items-center space-x-2 text-sm">
                                                <input type="checkbox" checked={newRolePermissions.includes(p.id)} onChange={e => handlePermissionChange(p.id, e.target.checked)} className="bg-gray-700 border-gray-500 text-green-500 focus:ring-green-500"/>
                                                <span>{p.description}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full">Save New Role</button>
                            </form>
                        )}
                    </div>
                )}


                {/* Modal Actions */}
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                    <button onClick={() => onSaveRole(user.id, selectedRoleId)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default RoleEditorModal;
