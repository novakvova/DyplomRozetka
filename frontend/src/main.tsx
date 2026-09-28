import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { App } from './App';
import { store } from './store/store';

import './styles.css';

const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
    throw new Error(
        'VITE_GOOGLE_CLIENT_ID не налаштований у .env'
    );
}

ReactDOM.createRoot(
    document.getElementById('root')!
).render(
    <React.StrictMode>
        <GoogleOAuthProvider
            clientId={googleClientId}
        >
            <Provider store={store}>
                <App />
            </Provider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);