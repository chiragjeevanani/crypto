import React from 'react';

/**
 * ErrorBoundary - A wrapper component to catch JavaScript errors anywhere in its 
 * child component tree and display a fallback UI instead of crashing the whole app.
 * 
 * NOTE: Error Boundaries must be Class Components in React.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    // Static method used to update state so the next render shows the fallback UI
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    // Lifecycle method called after an error has been thrown
    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service here
        console.group('🔴 React Error Boundary Caught an Error');
        console.error('Error:', error);
        console.info('Component Stack:', errorInfo.componentStack);
        console.groupEnd();
    }

    // Helper to reset the error state (e.g. for a "Try Again" button)
    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            // If a custom fallback is provided as a prop, use it
            if (this.props.fallback) {
                return typeof this.props.fallback === 'function' 
                    ? this.props.fallback(this.state.error, this.handleReset) 
                    : this.props.fallback;
            }

            // Default fallback UI
            return (
                <div 
                    className="p-6 rounded-2xl border border-rose-100 bg-rose-50/50 backdrop-blur-sm text-rose-600 my-4"
                    style={{ 
                        border: '1px solid rgba(225, 29, 72, 0.1)',
                        background: 'rgba(255, 251, 252, 0.8)'
                    }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-lg font-bold">!</span>
                        </div>
                        <h3 className="font-bold text-sm">Something went wrong in this section</h3>
                    </div>
                    <p className="text-xs text-rose-500/80 mb-2 leading-relaxed">
                        We encountered a problem while rendering this part of the app. It might be a temporary issue.
                    </p>
                    {this.state.error && (
                        <pre className="text-[10px] font-mono bg-white/60 p-2.5 rounded-lg mb-4 max-h-[150px] overflow-auto border border-rose-200/50 text-rose-800 leading-normal text-left">
                            {this.state.error.message}
                            {"\n\n"}
                            {this.state.error.stack}
                        </pre>
                    )}
                    <div className="flex gap-2">
                        <button 
                            onClick={this.handleReset}
                            className="text-xs font-bold px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-sm active:scale-95"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
