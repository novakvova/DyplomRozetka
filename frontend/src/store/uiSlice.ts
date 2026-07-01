import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthMode = 'login' | 'register' | 'recover';

type UiState = {
    message: string;
    authMode: AuthMode;
};

const initialState: UiState = {
    message: '',
    authMode: 'login',
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
    },
});

export const { messageSet, authModeSet } = uiSlice.actions;
export default uiSlice.reducer;