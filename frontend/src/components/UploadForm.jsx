import React, { useState } from 'react'
import axios from 'axios'
import ResultsView from './ResultsView'
import AutoFillForm from './AutoFillForm'

const docOptions = [
  { value: 'passport', label: 'Passport' },
  { value: 'aadhar', label: 'Aadhar' }
];

export default function UploadForm(){
  const [docType, setDocType] = useState('passport')
  const [file, setFile] = useState(null)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [view, setView] = useState('upload') // 'upload', 'results', 'form'
  const [fileInputKey, setFileInputKey] = useState(Date.now()) // Key to force file input reset

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!file) { setError('Please select a file'); return; }
    if (!consent) { setError('Please give consent to process'); return; }

    console.log('=== UPLOAD STARTED ===');
    console.log('Document Type:', docType);
    console.log('File:', file.name);
    console.log('File Size:', file.size);

    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('documentType', docType)
    fd.append('consent', 'true')
    
    console.log('FormData documentType:', fd.get('documentType'));
    
    try {
      const res = await axios.post('http://localhost:5000/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 seconds for OCR processing
      })
      console.log('=== UPLOAD SUCCESS ===');
      console.log('Response:', res.data);
      setResult(res.data)
      
      // If successful, go directly to results
      setView('results')
    } catch (err) {
      // Handle errors
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout - OCR processing took too long. Try with a smaller or clearer image.')
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to backend server. Make sure the backend is running on port 5000.')
      } else {
        setError(err.response?.data?.error || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setConsent(false)
    setView('upload')
    setFileInputKey(Date.now()) // Force file input to reset by changing key
  }

  if (view === 'form' && result) {
    return <AutoFillForm result={result} onBack={() => setView('results')} onReset={reset} />
  }

  if (view === 'results' && result) {
    return <ResultsView result={result} onFillForm={() => setView('form')} onBack={() => setView('upload')} />
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8">
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Document Type
            </label>
            <select 
              value={docType} 
              onChange={e=>setDocType(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {docOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Document
            </label>
            <input 
              key={fileInputKey}
              type="file" 
              accept="image/*,.pdf" 
              onChange={e=>setFile(e.target.files[0])} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
          <input 
            type="checkbox" 
            id="consent" 
            checked={consent} 
            onChange={e=>setConsent(e.target.checked)} 
            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="consent" className="text-sm text-gray-700">
            I consent to processing and archiving this document for identity verification purposes. 
            The document will be securely stored and processed in accordance with data protection regulations.
          </label>
        </div>

        <div className="flex gap-4">
          <button 
            type="submit" 
            disabled={loading || !file || !consent} 
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
          >
            {loading ? 'Processing...' : 'Upload & Extract Data'}
          </button>
          <button 
            type="button" 
            onClick={reset} 
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Reset
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-5 w-5 border-3 border-blue-600 border-t-transparent rounded-full"></div>
            <div>
              <span className="text-blue-700 font-medium block">
                Processing document... This may take up to 60 seconds
              </span>
              {/* <span className="text-blue-600 text-sm mt-1 block">
                OCR is analyzing your {docType === 'aadhar' ? 'Aadhaar' : docType === 'driving_license' ? 'Driving License' : 'Passport'}...
              </span> */}
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-6 p-6 bg-red-50 border-2 border-red-300 rounded-lg shadow-lg">
          <div className="flex items-start space-x-3">
            <svg className="h-6 w-6 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <div className="flex-1">
              <h4 className="text-red-800 font-bold text-lg mb-1">Error</h4>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
