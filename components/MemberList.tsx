import React from 'react';
import { User, Role } from '../types';
import * as store from '../data/store';

interface MemberListProps {
    users: User[];
    roles: Role[];
    currentUser: User;
    onEditUser: (user: User) => void;
}

const formatDistanceToNow = (timestamp: number): string => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes";
    return Math.floor(seconds) + " seconds";
}

const MemberList: React.FC<MemberListProps> = ({ users, roles, currentUser, onEditUser }) => {
    const canAssignRoles = store.hasPermission(currentUser, roles, 'assign_roles');

    const sortedUsers = [...users].sort((a, b) => a.username.localeCompare(b.username));

    return (
        <div className="p-2">
            <h2 className="p-2 text-sm font-bold text-gray-400 uppercase">Members ({users.length})</h2>
            <ul>
                {sortedUsers.map(user => {
                    const role = roles.find(r => r.id === user.roleId);
                    return (
                        <li key={user.id} className="p-2 rounded hover:bg-gray-800 flex justify-between items-center">
                            <div>
                                <p className={`text-sm font-bold ${role?.style ?? 'text-gray-300'}`}>{user.username}</p>
                                <p className="text-xs text-gray-500">Joined {formatDistanceToNow(user.createdAt)} ago</p>
                            </div>
                            {canAssignRoles && currentUser.id !== user.id && (
                                <button
                                    onClick={() => onEditUser(user)}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                                >
                                    Edit
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default MemberList;
