import React from 'react';
import ReactDOM from 'react-dom/client';
// App pulls in @mantine/core/styles.css, so it must be imported BEFORE
// index.css. At equal specificity the later stylesheet wins, and our own
// styles should be the ones overriding Mantine, not the other way round.
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';
import startMockServer from './MockBackend';

// Start the mock server if we're in development mode and using mock data
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
  console.log('Starting mock backend server for development');
  startMockServer();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
