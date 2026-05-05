import React from 'react'

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error(`[ErrorBoundary] ${this.props.name || 'Component'} crashed:`, error, info.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center fade-in">
                    <div className="text-5xl mb-3">⚠️</div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Something went wrong</h3>
                    <p className="text-gray-500 text-sm mb-4 max-w-xs">
                        {this.props.name || 'This section'} encountered an error. Your data is safe.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="bg-primary/20 border border-accent/40 text-accent px-5 py-2 rounded-xl
                            text-sm font-semibold hover:bg-primary/30 transition-all"
                        aria-label="Retry loading this section"
                    >
                        🔄 Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
