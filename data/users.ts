// NOTE: This file is ONLY for session management.
// All user data is now managed in `data/store.ts`.

import { User } from '../types';

const SESSION_KEY = 'threadirc_user'; // Using localStorage for persistence

export const setSessionUser = (user: User) => {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (e) {
        console.error("Could not save user session", e);
    }
};

export const getSessionUser = (): User | null => {
    try {
        const userJson = localStorage.getItem(SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        console.error("Could not retrieve user session", e);
        return null;
    }
};

export const clearSessionUser = () => {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (e) {
        console.error("Could not clear user session", e);
    }
};