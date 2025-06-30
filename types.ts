export type Permission = 
  | 'delete_any_post'
  | 'delete_any_thread'
  | 'create_infinite_channels'
  | 'assign_roles'
  | 'manage_roles';

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
    style: string; // Tailwind CSS classes
}

export interface User {
  id: string;
  username: string;
  password: string; // Note: In a real app, this should be a hashed password.
  roleId: string;
  createdAt: number;
}

export interface Post {
  id:string;
  author: {
    id: string;
    username: string;
  };
  content: string;
  timestamp: number;
  // Tracks votes: { [userId: string]: 1 for upvote, -1 for downvote }
  votes: Record<string, 1 | -1>;
}

export interface Thread {
  id: string;
  channelId: string;
  title: string;
  originalPost: Post;
  comments: Post[];
  lastActivity: number;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  ownerId: string; // ID of the user who created it
  isPrivate: boolean;
  threads: Thread[];
}