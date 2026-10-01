import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthMode = 'login' | 'register' | 'recover';

type UiState = {
    message: string;
    authMode: AuthMode;
    cartModalOpen: boolean;
    favoriteModalOpen: boolean;
};

const initialState: UiState = {
    message: '',
    authMode: 'login',
    cartModalOpen: false,
    favoriteModalOpen: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        messageSet(state, action: PayloadAction<string>) {
            state.message = action.payload;
        },
        authModeSet(state, action: PayloadAction<AuthMode>) {
            state.authMode = action.payload;
        },
        cartModalOpened(state) {
            state.cartModalOpen = true;
        },
        cartModalClosed(state) {
            state.cartModalOpen = false;
        },
        favoriteModalOpened(state) {
            state.favoriteModalOpen = true;
        },
        favoriteModalClosed(state) {
            state.favoriteModalOpen = false;
        },
    },
});

export const {
    messageSet,
    authModeSet,
    cartModalOpened,
    cartModalClosed,
    favoriteModalOpened,
    favoriteModalClosed,
} = uiSlice.actions;
export default uiSlice.reducer;