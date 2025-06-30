import React, { useState } from 'react';
import { Thread, Post, User, Role } from '../types';
import * as store from '../data/store';

// Helper to format timestamps
const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
};

// PostItem sub-component defined within the same file
interface PostItemProps {
    post: Post;
    isOP: boolean;
    currentUser: User;
    roles: Role[];
    onVote: (postId: string, direction: 1 | -1) => void;
    onDelete: (postId: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, isOP, currentUser, roles, onVote, onDelete }) => {
    const voteCount = Object.values(post.votes).reduce((sum, vote) => sum + vote, 0);
    const voteColor = voteCount > 0 ? 'text-green-400' : voteCount < 0 ? 'text-red-400' : 'text-gray-400';
    
    const userVote = post.votes[currentUser.id];
    const upvoteStyle = userVote === 1 ? 'text-green-500 font-extrabold' : 'text-gray-400 hover:text-green-400';
    const downvoteStyle = userVote === -1 ? 'text-red-500 font-extrabold' : 'text-gray-400 hover:text-red-400';
    
    const canDelete = currentUser.id === post.author.id || 
                      (isOP ? store.hasPermission(currentUser, roles, 'delete_any_thread') : store.hasPermission(currentUser, roles, 'delete_any_post'));

    return (
        <div className={`bg-gray-800 border ${isOP ? 'border-green-700' : 'border-gray-700'} rounded-lg p-4 mb-4`} id={`post-${post.id}`}>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <div>
                    <span>User: <span className="text-green-400">{post.author.username}</span></span>
                    <span className="mx-2">&#8226;</span>
                    <span>{formatTimestamp(post.timestamp)}</span>
                     {isOP && <span className="ml-2 font-bold text-green-500">[OP]</span>}
                </div>
                 {canDelete && (
                    <button onClick={() => onDelete(post.id)} className="text-red-500 hover:underline text-xs">[Delete]</button>
                )}
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center mt-3 text-sm">
                <button onClick={() => onVote(post.id, 1)} className={`font-bold ${upvoteStyle}`}>[+]</button>
                <span className={`font-bold mx-2 w-6 text-center ${voteColor}`}>{voteCount}</span>
                <button onClick={() => onVote(post.id, -1)} className={`font-bold ${downvoteStyle}`}>[-]</button>
            </div>
        </div>
    );
};


// Main ThreadView Component
interface ThreadViewProps {
    thread: Thread;
    currentUser: User;
    roles: Role[];
    onBack: () => void;
    onNewComment: (content: string) => void;
    onVote: (postId: string, direction: 1 | -1) => void;
    onDeletePost: (postId: string) => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({ thread, currentUser, roles, onBack, onNewComment, onVote, onDeletePost }) => {
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (comment.trim()) {
            onNewComment(comment.trim());
            setComment('');
        }
    };

    return (
        <div>
            <button onClick={onBack} className="text-blue-400 hover:underline mb-4">&larr; Back to channel</button>
            <h1 className="text-2xl font-bold text-green-400 mb-2">{thread.title}</h1>

            <div className="mb-6">
                <PostItem post={thread.originalPost} isOP={true} onVote={onVote} currentUser={currentUser} roles={roles} onDelete={onDeletePost} />
            </div>

            <h2 className="text-lg text-gray-400 border-b border-gray-700 pb-2 mb-4">Comments ({thread.comments.length})</h2>
            
            <div className="mb-6">
                {thread.comments
                    .slice() // Create a shallow copy to avoid mutating props
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map(commentPost => (
                        <PostItem key={commentPost.id} post={commentPost} isOP={false} onVote={onVote} currentUser={currentUser} roles={roles} onDelete={onDeletePost} />
                ))}
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-md font-semibold text-gray-300 mb-2">Post a Reply</h3>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full h-24 bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Your comment..."
                    />
                    <div className="flex justify-end mt-2">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThreadView;