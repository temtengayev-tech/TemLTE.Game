import { Component, type ErrorInfo, type ReactNode } from 'react'

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; message: string }> {
  state = { failed: false, message: '' }

  static getDerivedStateFromError(error: Error) { return { failed: true, message: error.message } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fightron recovered from a screen error', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="app-recovery"><small>FIGHTRON SYSTEM RECOVERY</small><h1>THE SCREEN STOPPED</h1><p>{this.state.message || 'Reload the arena to continue.'}</p><button onClick={() => window.location.reload()}>RELOAD FIGHTRON</button></main>
  }
}
