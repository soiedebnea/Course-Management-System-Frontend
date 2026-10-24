import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import './styles.css';

// Shows the error on screen instead of a blank page
class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <pre style={{ padding: '1rem', color: '#b3261e', whiteSpace: 'pre-wrap' }}>Something went wrong: {String(this.state.error.message)}</pre>;
  }
}

createRoot(document.getElementById('root')).render(
  <Boundary>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </Boundary>
);