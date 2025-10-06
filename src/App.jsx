import React from 'react'
import BessQuoteBuilder from './components/BessQuoteBuilder'

export default function App() {
  try {
    return <BessQuoteBuilder />
  } catch (error) {
    console.error('App Error:', error)
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Merlin BESS Quote Builder</h1>
        <div style={{ 
          border: '2px solid red', 
          padding: '15px', 
          backgroundColor: '#ffe6e6',
          borderRadius: '5px',
          marginTop: '20px' 
        }}>
          <h2>Error Loading Application</h2>
          <p>There was an error loading the quote builder. Please refresh the page.</p>
          <p><strong>Error:</strong> {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}
