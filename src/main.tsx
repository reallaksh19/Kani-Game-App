import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LearnerSyncBootstrap } from './components/integration/LearnerSyncBootstrap';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <ThemeProvider>
                <AppProvider>
                    <LearnerSyncBootstrap />
                    <App />
                </AppProvider>
            </ThemeProvider>
        </React.StrictMode>
    );
}
