import React, { useState, useEffect, useCallback } from 'react';
import { Channel, Thread, Post, User, Role, Permission } from './types';
import * as store from './data/store';
import * as userService from './data/users';
import ChannelView from './components/ChannelView';
import ThreadView from './components/ThreadView';
import AuthView from './components/AuthView';
import MemberList from './components/MemberList';
import RoleEditorModal from './components/RoleEditorModal';

const NewChannelForm: React.FC<{
    onCreate: (name: string, description: string) => void;
    onCancel: () => void;
}> = ({ onCreate, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && description.trim()) {
            onCreate(name.trim(), description.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Create New Channel</h3>
            <input
                type="text"
                placeholder="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full bg-gray-900 text-white p-2 text-sm rounded border border-gray-600 mb-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <input
                type="text"
                placeholder="Channel description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-900 text-white p-2 text-sm rounded border border-gray-600 mb-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <div className="flex justify-end gap-2">
                 <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm">
                    Cancel
                </button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm">
                    Create
                </button>
            </div>
        </form>
    )
}

const App: React.FC = () => {
    const [data, setData] = useState(() => store.loadData());
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [isMemberListVisible, setIsMemberListVisible] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);


    // Initial load effect
    useEffect(() => {
        const sessionUser = userService.getSessionUser();
        if (sessionUser) {
           const fullUser = data.users.find(u => u.id === sessionUser.id);
           if (fullUser) {
             setCurrentUser(fullUser);
           } else {
             // Session user not found in current user list, clear session
             userService.clearSessionUser();
           }
        }
        
        if (data.channels.length > 0 && !selectedChannelId) {
            setSelectedChannelId(data.channels[0].id);
        }
    }, []);
    
    // Persist data whenever it changes
    useEffect(() => {
        store.saveData(data);
    }, [data]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        userService.setSessionUser(user);
    };
    
    const handleRegister = (username:string, password:string): User | string => {
        const result = store.addUser(data, username, password);
        if(result) {
            setData(result.data);
            handleLogin(result.newUser);
            return result.newUser;
        }
        return "Username is already taken.";
    };

    const handleLogout = () => {
        setCurrentUser(null);
        userService.clearSessionUser();
        setSelectedThreadId(null);
        if (data.channels.length > 0) {
          setSelectedChannelId(data.channels[0].id);
        }
    };

    const handleSelectChannel = (channelId: string) => {
        setSelectedChannelId(channelId);
        setSelectedThreadId(null);
    };

    const handleSelectThread = (threadId: string) => {
        setSelectedThreadId(threadId);
    };

    const handleBackToChannel = () => {
        setSelectedThreadId(null);
    };

    const handleVote = useCallback((postId: string, threadId: string, direction: 1 | -1) => {
        if (!currentUser || !selectedChannelId) return;
        const updatedChannels = store.updateVote(data.channels, selectedChannelId, threadId, postId, direction, currentUser.id);
        setData(prevData => ({ ...prevData, channels: updatedChannels }));
    }, [currentUser, selectedChannelId, data.channels]);


    const handleNewThread = async (title: string, content: string) => {
        if (!selectedChannelId || !currentUser) return;
        const newThread = store.createThread(title, content, selectedChannelId, currentUser);
        const updatedChannels = data.channels.map(channel =>
            channel.id === selectedChannelId
                ? { ...channel, threads: [newThread, ...channel.threads] }
                : channel
        );
        setData(prevData => ({ ...prevData, channels: updatedChannels }));
    };

    const handleNewChannel = (name: string, description: string) => {
        if (!currentUser) return;
        const newData = store.createChannel(data, name, description, currentUser);
        if (newData) {
            setData(newData);
            const newChannel = newData.channels[newData.channels.length - 1];
            handleSelectChannel(newChannel.id);
        } else {
            alert(`Channel creation failed. Users are limited to ${4} channels. High-level ranks have no limit.`);
        }
        setIsCreatingChannel(false);
    };

    const handleNewComment = (threadId: string, content: string) => {
         if (!selectedChannelId || !currentUser) return;
         const newComment = store.createComment(content, currentUser);
         const updatedChannels = store.addCommentToThread(data.channels, selectedChannelId, threadId, newComment);
         setData(prevData => ({...prevData, channels: updatedChannels}));
    };

    const handleDeletePost = (postId: string, threadId: string) => {
        if (!selectedChannelId || !currentUser) return;
        
        const newData = store.deletePostFromThread(data, selectedChannelId, threadId, postId, currentUser);
        setData(newData);

        const channel = newData.channels.find(c => c.id === selectedChannelId);
        const threadExists = channel?.threads.some(t => t.id === threadId);
        if (!threadExists) {
            handleBackToChannel();
        }
    };

    const handleUpdateUserRole = (userId: string, roleId: string) => {
        const newData = store.updateUserRole(data, userId, roleId);
        setData(newData);
        setEditingUser(null);
    };

    const handleCreateRole = (role: Omit<Role, 'id'>) => {
        const newData = store.addRole(data, role);
        setData(newData);
    };

    if (!currentUser) {
        return <AuthView onLogin={handleLogin} onRegister={handleRegister} findUserByUsername={(u) => store.findUserByUsername(data.users, u)} />;
    }

    const selectedChannel = data.channels.find(c => c.id === selectedChannelId);
    const selectedThread = selectedChannel?.threads.find(t => t.id === selectedThreadId);
    const currentUserRole = data.roles.find(r => r.id === currentUser.roleId);

    const renderContent = () => {
        if (selectedThread && selectedChannel) {
            return <ThreadView
                thread={selectedThread}
                currentUser={currentUser}
                roles={data.roles}
                onBack={handleBackToChannel}
                onNewComment={(content) => handleNewComment(selectedThread.id, content)}
                onVote={(postId, direction) => handleVote(postId, selectedThread.id, direction)}
                onDeletePost={(postId) => handleDeletePost(postId, selectedThread.id)}
            />;
        }
        if (selectedChannel) {
            return <ChannelView
                channel={selectedChannel}
                currentUser={currentUser}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
            />;
        }
        return <div className="text-gray-500 text-center p-8">Select or create a channel to begin.</div>;
    };
    
    return (
        <div className="flex h-screen bg-gray-900 text-gray-300 font-mono">
            {editingUser && store.hasPermission(currentUser, data.roles, 'assign_roles') && (
                <RoleEditorModal
                    user={editingUser}
                    roles={data.roles}
                    canManageRoles={store.hasPermission(currentUser, data.roles, 'manage_roles')}
                    onClose={() => setEditingUser(null)}
                    onSaveRole={handleUpdateUserRole}
                    onCreateRole={handleCreateRole}
                />
            )}
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-green-400">ThreadIRC</h1>
                     <div className="text-xs text-gray-500 mt-2">
                        Logged in as: <span className="font-bold text-green-300">{currentUser.username}</span> 
                        <span className={currentUserRole?.style}> [{currentUserRole?.name}]</span>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto">
                     <h2 className="px-3 pt-3 pb-1 text-xs font-bold text-gray-500 uppercase">Channels</h2>
                    <ul>
                        {data.channels.map(channel => (
                            <li key={channel.id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelectChannel(channel.id); }}
                                    className={`block p-3 text-sm truncate ${selectedChannelId === channel.id ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                                >
                                    # {channel.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-gray-800 space-y-2">
                     <button onClick={() => setIsCreatingChannel(c => !c)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">
                        New Channel
                    </button>
                    <button onClick={() => setIsMemberListVisible(v => !v)} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm">
                        {isMemberListVisible ? 'Hide Members' : 'Show Members'}
                    </button>
                     <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm">
                        Logout
                    </button>
                </div>
                {isCreatingChannel && <NewChannelForm onCreate={handleNewChannel} onCancel={() => setIsCreatingChannel(false)} />}
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                {renderContent()}
            </main>

            {/* Member List */}
            {isMemberListVisible && (
                <aside className="w-64 bg-gray-900 border-l border-gray-800 flex-shrink-0 overflow-y-auto">
                    <MemberList 
                        users={data.users} 
                        roles={data.roles} 
                        currentUser={currentUser}
                        onEditUser={setEditingUser}
                    />
                </aside>
            )}
        </div>
    );
};

export default App;