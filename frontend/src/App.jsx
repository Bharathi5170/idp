import React, { useState } from 'react'
import UploadForm from './components/UploadForm'
import DocumentViewer from './components/DocumentViewer'

export default function App(){
  const [view, setView] = useState('upload') // 'upload' or 'documents'

  if (view === 'documents') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              IDP — Intelligent Document Processing
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              AI-Powered Document Extraction & Auto-Fill System
            </p>
          </header>

          <DocumentViewer onBack={() => setView('upload')} />

          <footer className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 IDP System. Powered by AI & OCR Technology</p>
          </footer>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            IDP — Intelligent Document Processing
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            AI-Powered Document Extraction & Auto-Fill System
          </p>
        </header>

        {/* View Documents Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setView('documents')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            View Uploaded Documents
          </button>
        </div>

        <UploadForm />

        {/* Processing Flow Info */}
        <div className="mt-8 bg-white shadow-lg rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Processing Flow</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Upload</h4>
              <p className="text-sm text-gray-600">Select document type and upload file</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Extract</h4>
              <p className="text-sm text-gray-600">AI extracts fields with OCR</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Validate</h4>
              <p className="text-sm text-gray-600">Confidence scores & validation</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Auto-Fill</h4>
              <p className="text-sm text-gray-600">Pre-populate forms instantly</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <h4 className="font-semibold text-gray-800">High Accuracy</h4>
                <p className="text-sm text-gray-600">95%+ extraction accuracy</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <div>
                <h4 className="font-semibold text-gray-800">Fast Processing</h4>
                <p className="text-sm text-gray-600">Results in 2-3 seconds</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <div>
                <h4 className="font-semibold text-gray-800">Secure Storage</h4>
                <p className="text-sm text-gray-600">Encrypted & compliant</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 IDP System. Powered by AI & OCR Technology</p>
        </footer>
      </div>
    </div>
  )
}
