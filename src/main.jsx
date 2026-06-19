import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: '#fff5f5', color: '#b31522', fontFamily: 'monospace', minHeight: '100vh', boxSizing: 'border-box' }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Render Error Caught</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1.5px solid #feb2b2', overflow: 'auto' }}>
            {this.state.error && this.state.error.toString()}
            {"\n\n"}
            {this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
