import React, { useState } from 'react';
import { User } from '../types';

interface AuthViewProps {
    onLogin: (user: User) => void;
    onRegister: (username: string, password: string) => User | string;
    findUserByUsername: (username: string) => User | undefined;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, findUserByUsername }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validateRegistration = (): boolean => {
        if (username.length < 3 || username.length > 15) {
            setError("Username must be between 3 and 15 characters.");
            return false;
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
            setError("Username can only contain letters, numbers, underscores, dots, and hyphens.");
            return false;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return false;
        }
        return true;
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const user = findUserByUsername(username);
        if (user && user.password === password) {
            onLogin(user);
        } else {
            setError("Invalid username or password.");
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!validateRegistration()) {
            return;
        }
        const result = onRegister(username, password);
        if (typeof result !== 'string') {
           // Success, login is handled by App
        } else {
            setError(result);
        }
    };
    
    const clearForm = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
    }

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        clearForm();
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-300 font-mono">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-green-400">ThreadIRC</h1>
                    <p className="text-gray-400 mt-2">{isLoginView ? "Login to your account" : "Create a new account"}</p>
                </div>

                {error && <div className="bg-red-900 border border-red-500 text-red-300 px-4 py-3 rounded-md text-sm">{error}</div>}

                <form onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-400 block mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-400 block mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    {!isLoginView && (
                         <div>
                            <label className="text-sm font-bold text-gray-400 block mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    )}
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        {isLoginView ? "Login" : "Register"}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <button onClick={toggleView} className="text-blue-400 hover:underline">
                        {isLoginView ? "Need an account? Register" : "Already have an account? Login"}
                    </button>
                </div>
                 <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700">
                    <p>Owner: niko.is.here / SIgmaPass123</p>
                    <p>Admin: admin / password123</p>
                    <p>Mod: mod / password123</p>
                </div>
            </div>
        </div>
    );
};

export default AuthView;