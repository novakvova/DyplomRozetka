import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthResponse, User } from '../types';

type AuthState = {
    user: User | null;
    sessionExpired: boolean;
};

function readStoredUser(): User | null {
    const raw = localStorage.getItem('rozetka_fullstack_user');
    return raw ? (JSON.parse(raw) as User) : null;
}

localStorage.removeItem('rozetka_fullstack_token');

const initialState: AuthState = {
    user: readStoredUser(),
    sessionExpired: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        credentialsSet(state, action: PayloadAction<Pick<AuthResponse, 'user'>>) {
            state.user = action.payload.user;
            state.sessionExpired = false;
            localStorage.setItem('rozetka_fullstack_user', JSON.stringify(action.payload.user));
        },
        userUpdated(state, action: PayloadAction<User>) {
            state.user = action.payload;
            localStorage.setItem('rozetka_fullstack_user', JSON.stringify(action.payload));
        },
        logout(state) {
            state.user = null;
            state.sessionExpired = false;
            localStorage.removeItem('rozetka_fullstack_user');
        },
        sessionExpiredSet(state) {
            state.user = null;
            state.sessionExpired = true;
            localStorage.removeItem('rozetka_fullstack_user');
        },
        sessionExpiredHandled(state) {
            state.sessionExpired = false;
        },
    },
});

export const { credentialsSet, userUpdated, logout, sessionExpiredSet, sessionExpiredHandled } = authSlice.actions;
export default authSlice.reducer;