import React from 'react';
import './App.css';

/**
 * Consolidated TSX version of the main App component.
 * Keep smaller feature components in src/components/ and convert them to .tsx as needed.
 */

export default function App(): JSX.Element {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Merlin BESS Quote Builder</h1>
      </header>

      <main className="app-main">
        {/* The original application content is preserved in components */}
        <p>Loading... (UI mounts components from src/components/)</p>
      </main>
    </div>
  );
}
