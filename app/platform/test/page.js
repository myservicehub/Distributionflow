'use client'

import React, { useEffect, useState } from 'react'

export default function TestPage() {
  const [apiData, setApiData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('🧪 Test page mounted')
    
    fetch('/api/platform?route=kpis')
      .then(res => {
        console.log('📡 Response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('📊 Data received:', data)
        setApiData(data)
      })
      .catch(err => {
        console.error('❌ Error:', err)
        setError(err.message)
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Platform API Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {apiData && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Success! API is working</h2>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}
      
      {!apiData && !error && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Loading...
        </div>
      )}
    </div>
  )
}
