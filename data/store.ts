import { Channel, Post, Thread, User, Role, Permission } from '../types';

const STORAGE_KEY = 'threadirc_data_v2';

interface ForumData {
    channels: Channel[];
    users: User[];
    roles: Role[];
}

const getDefaultData = (): ForumData => {
    const now = Date.now();
    const roles: Role[] = [
        { id: 'role-owner', name: 'OWNER', permissions: ['delete_any_post', 'delete_any_thread', 'create_infinite_channels', 'assign_roles', 'manage_roles'], style: 'text-red-500 font-black' },
        { id: 'role-dev', name: 'DEVELOPER', permissions: ['delete_any_post', 'delete_any_thread', 'create_infinite_channels'], style: 'text-blue-400' },
        { id: 'role-admin', name: 'ADMIN', permissions: ['delete_any_post', 'delete_any_thread', 'create_infinite_channels'], style: 'text-red-400' },
        { id: 'role-smod', name: 'SECOND MOD', permissions: ['delete_any_post'], style: 'text-indigo-400' },
        { id: 'role-mod', name: 'MOD', permissions: ['delete_any_post'], style: 'text-purple-400' },
        { id: 'role-user', name: 'USER', permissions: [], style: 'text-yellow-400' },
    ];

    const users: User[] = [
        { id: 'user-owner', username: 'niko.is.here', password: 'SIgmaPass123', roleId: 'role-owner', createdAt: now - 1000 * 60 * 60 * 24 * 10 },
        { id: 'user-dev', username: 'developer', password: 'password123', roleId: 'role-dev', createdAt: now - 1000 * 60 * 60 * 24 * 5 },
        { id: 'user-admin', username: 'admin', password: 'password123', roleId: 'role-admin', createdAt: now - 1000 * 60 * 60 * 24 * 5 },
        { id: 'user-smod', username: 'secondmod', password: 'password123', roleId: 'role-smod', createdAt: now - 1000 * 60 * 60 * 24 * 2 },
        { id: 'user-mod', username: 'mod', password: 'password123', roleId: 'role-mod', createdAt: now - 1000 * 60 * 60 * 24 * 2 },
        { id: 'user-dummy1', username: 'dummyUser1', password: 'password123', roleId: 'role-user', createdAt: now - 1000 * 60 * 30 },
        { id: 'user-dummy2', username: 'dummyUser2', password: 'password123', roleId: 'role-user', createdAt: now - 1000 * 60 * 15 },
    ];
    
    const channels: Channel[] = [
        {
            id: 'chan-1', name: 'general', description: 'General discussion, news, and everything that doesn\'t fit elsewhere.', ownerId: 'user-admin', isPrivate: false,
            threads: [
                {
                    id: 'thread-1', channelId: 'chan-1', title: 'Welcome to ThreadIRC!', lastActivity: now - 1000 * 60 * 5,
                    originalPost: {
                        id: 'post-1', author: { id: 'user-admin', username: 'admin' },
                        content: 'This is a new forum. Feel free to create an account and start posting.\n\nRules:\n1. Be excellent to each other.\n2. No illegal content.\n3. Admins have the final say.',
                        timestamp: now - 1000 * 60 * 10, votes: { 'user-admin': 1, 'user-mod': 1 },
                    },
                    comments: [
                        { id: 'post-2', author: { id: 'user-mod', username: 'mod' }, content: 'Glad to be here!', timestamp: now - 1000 * 60 * 5, votes: { 'user-mod': 1 } }
                    ],
                },
            ],
        },
        { id: 'chan-2', name: 'tech', description: 'Hardware, software, and everything in between.', ownerId: 'user-admin', isPrivate: false, threads: [] },
    ];

    return { roles, users, channels };
};


export const loadData = (): ForumData => {
    try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (rawData) {
            const data = JSON.parse(rawData);
            // Basic validation to ensure the loaded data has the expected structure
            if (data.channels && data.users && data.roles) {
                return data;
            }
        }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
    }
    // If no data or parsing fails, return default and save it
    const defaultData = getDefaultData();
    saveData(defaultData);
    return defaultData;
};

export const saveData = (data: ForumData) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
};

// --- User Management ---

export const findUserByUsername = (users: User[], username: string): User | undefined => {
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
};

export const addUser = (data: ForumData, username: string, password: string): { data: ForumData, newUser: User } | null => {
    if (findUserByUsername(data.users, username)) {
        return null; // Username already exists
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        username: username,
        password: password,
        roleId: 'role-user', // All new users are regular users
        createdAt: Date.now(),
    };
    const updatedUsers = [...data.users, newUser];
    return { data: { ...data, users: updatedUsers }, newUser };
};

export const updateUserRole = (data: ForumData, userId: string, newRoleId: string): ForumData => {
    const updatedUsers = data.users.map(u => u.id === userId ? { ...u, roleId: newRoleId } : u);
    return { ...data, users: updatedUsers };
};


// --- Role Management ---

export const addRole = (data: ForumData, role: Omit<Role, 'id'>): ForumData => {
    const newRole: Role = { ...role, id: `role-custom-${Date.now()}` };
    const updatedRoles = [...data.roles, newRole];
    return { ...data, roles: updatedRoles };
};


// --- Permissions ---
export const hasPermission = (user: User, roles: Role[], permission: Permission): boolean => {
    const userRole = roles.find(r => r.id === user.roleId);
    if (!userRole) return false;
    return userRole.permissions.includes(permission);
};

// --- Channel Management ---
const USER_CHANNEL_LIMIT = 4;
export const createChannel = (data: ForumData, name: string, description: string, user: User): ForumData | null => {
    if (!hasPermission(user, data.roles, 'create_infinite_channels')) {
        const userOwnedChannels = data.channels.filter(c => c.ownerId === user.id).length;
        if (userOwnedChannels >= USER_CHANNEL_LIMIT) {
            return null; // Limit reached
        }
    }

    const newChannel: Channel = {
        id: `chan-${Date.now()}`,
        name: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description,
        ownerId: user.id,
        isPrivate: false,
        threads: [],
    };
    const updatedChannels = [...data.channels, newChannel];
    return { ...data, channels: updatedChannels };
}


// --- Thread & Post Management ---
export const createThread = (title: string, content: string, channelId: string, author: User): Thread => {
    const now = Date.now();
    const newPost: Post = {
        id: `post-${now}`,
        author: { id: author.id, username: author.username },
        content: content,
        timestamp: now,
        votes: { [author.id]: 1 }, // Author auto-upvotes their own post
    };
    return {
        id: `thread-${now}`,
        channelId: channelId,
        title: title,
        originalPost: newPost,
        comments: [],
        lastActivity: now,
    };
};

export const createComment = (content: string, author: User): Post => {
    const now = Date.now();
    return {
        id: `post-${now}`,
        author: { id: author.id, username: author.username },
        content: content,
        timestamp: now,
        votes: { [author.id]: 1 }, // Author auto-upvotes their own comment
    };
};

export const addCommentToThread = (channels: Channel[], channelId: string, threadId: string, comment: Post): Channel[] => {
    return channels.map(channel => {
        if (channel.id !== channelId) return channel;
        const updatedThreads = channel.threads.map(thread => {
            if (thread.id !== threadId) return thread;
            return {
                ...thread,
                comments: [...thread.comments, comment],
                lastActivity: comment.timestamp,
            };
        });
        return { ...channel, threads: updatedThreads };
    });
};

export const updateVote = (channels: Channel[], channelId: string, threadId: string, postId: string, direction: 1 | -1, userId: string): Channel[] => {
     return channels.map(channel => {
        if (channel.id !== channelId) return channel;
        const updatedThreads = channel.threads.map(thread => {
            if (thread.id !== threadId) return thread;

            let postToUpdate: Post | undefined;
            if (thread.originalPost.id === postId) {
                postToUpdate = thread.originalPost;
            } else {
                postToUpdate = thread.comments.find(c => c.id === postId);
            }

            if (postToUpdate) {
                const existingVote = postToUpdate.votes[userId];
                if (existingVote === direction) {
                    delete postToUpdate.votes[userId];
                } else {
                    postToUpdate.votes[userId] = direction;
                }
            }
            
            return { ...thread }; 
        });
        return { ...channel, threads: updatedThreads };
    });
}

export const deletePostFromThread = (data: ForumData, channelId: string, threadId: string, postId: string, currentUser: User): ForumData => {
    const canDeleteAnyPost = hasPermission(currentUser, data.roles, 'delete_any_post');
    const canDeleteAnyThread = hasPermission(currentUser, data.roles, 'delete_any_thread');

    const updatedChannels = data.channels.map(channel => {
        if (channel.id !== channelId) return channel;

        let threads = [...channel.threads];
        const threadIndex = threads.findIndex(t => t.id === threadId);

        if (threadIndex > -1) {
            const thread = { ...threads[threadIndex] };

            if (thread.originalPost.id === postId) {
                if (currentUser.id === thread.originalPost.author.id || canDeleteAnyThread) {
                    threads.splice(threadIndex, 1);
                }
            } else {
                const commentToDelete = thread.comments.find(c => c.id === postId);
                if (commentToDelete && (currentUser.id === commentToDelete.author.id || canDeleteAnyPost)) {
                    thread.comments = thread.comments.filter(c => c.id !== postId);
                    threads[threadIndex] = thread;
                }
            }
        }
        return { ...channel, threads };
    });

    return { ...data, channels: updatedChannels };
}
