import { Component } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error boundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-navy-600 text-ice-100 p-6">
          <div className="max-w-md w-full bg-white dark:bg-navy-700 rounded-2xl p-6 shadow-card border border-ice-200 dark:border-navy-500 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-navy-700 dark:text-white">Something went wrong</h1>
              <p className="text-sm text-navy-500 dark:text-ice-300">
                The app encountered an unexpected error. Your collection is still saved locally.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="text-xs text-left font-mono bg-ice-50 dark:bg-navy-600 rounded-lg p-3 text-navy-500 dark:text-ice-300 overflow-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-ice-100 dark:bg-navy-600 text-navy-700 dark:text-ice-100 font-medium hover:bg-ice-200 dark:hover:bg-navy-500 transition"
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-glaceon text-navy-700 font-medium hover:opacity-90 transition"
              >
                <RefreshCw className="w-4 h-4" /> Reload app
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
