import React, { useState } from 'react';
import { Channel, Thread, User } from '../types';

const getVoteCount = (votes: Record<string, 1 | -1>): number => {
    return Object.values(votes).reduce((sum, vote) => sum + vote, 0);
};

interface ThreadListItemProps {
    thread: Thread;
    onSelectThread: (threadId: string) => void;
}

const ThreadListItem: React.FC<ThreadListItemProps> = ({ thread, onSelectThread }) => {
    const opVotes = getVoteCount(thread.originalPost.votes);
    const commentVotes = thread.comments.reduce((sum, c) => sum + getVoteCount(c.votes), 0);
    const totalVotes = opVotes + commentVotes;
    
    const voteColor = totalVotes > 0 ? 'text-green-500' : totalVotes < 0 ? 'text-red-500' : 'text-gray-500';

    return (
        <div className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 border-b border-gray-700 cursor-pointer" onClick={() => onSelectThread(thread.id)}>
            <div className="flex items-center">
                <div className={`w-12 text-center font-bold text-lg ${voteColor}`}>
                    {totalVotes}
                </div>
                <div className="ml-4">
                    <p className="text-md text-blue-400 hover:underline">{thread.title}</p>
                    <p className="text-xs text-gray-500">
                        {thread.comments.length} comments &bull; last activity: {new Date(thread.lastActivity).toLocaleTimeString()} by {thread.originalPost.author.username}
                    </p>
                </div>
            </div>
        </div>
    );
};


interface NewThreadFormProps {
    onNewThread: (title: string, content: string) => Promise<void>;
}

const NewThreadForm: React.FC<NewThreadFormProps> = ({ onNewThread }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert("Title and content cannot be empty.");
            return;
        }
        setIsSubmitting(true);
        await onNewThread(title, content);
        setTitle('');
        setContent('');
        setIsSubmitting(false);
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-6">
            <h3 className="text-md font-semibold text-gray-300 mb-3">Create a new thread</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Thread Title"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                />
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Your post content..."
                    className="w-full h-24 bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex justify-end items-center mt-3">
                    <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-wait">
                        {isSubmitting ? 'Posting...' : 'Create Thread'}
                    </button>
                </div>
            </form>
        </div>
    );
}

interface ChannelViewProps {
    channel: Channel;
    onSelectThread: (threadId: string) => void;
    onNewThread: (title: string, content: string) => Promise<void>;
    currentUser: User;
}

const ChannelView: React.FC<ChannelViewProps> = ({ channel, onSelectThread, onNewThread }) => {
    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-green-400">#{channel.name}</h1>
                <p className="text-sm text-gray-400">{channel.description}</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                {channel.threads
                    .slice()
                    .sort((a, b) => b.lastActivity - a.lastActivity)
                    .map(thread => (
                    <ThreadListItem key={thread.id} thread={thread} onSelectThread={onSelectThread} />
                ))}
                 {channel.threads.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        No threads here yet. Be the first to create one!
                    </div>
                )}
            </div>
            <NewThreadForm onNewThread={onNewThread} />
        </div>
    );
};

export default ChannelView;