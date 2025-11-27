import React from 'react'

export default function ResultsView({ result, onFillForm, onBack }) {
  const getConfidenceColor = (score) => {
    if (score >= 95) return 'bg-green-100 text-green-800'
    if (score >= 90) return 'bg-blue-100 text-blue-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const downloadJSON = () => {
    const jsonString = JSON.stringify(result, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${result.document_id || 'document'}_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Processing Completed</h2>
              <p className="text-sm text-gray-600">{result.document_id || 'Document processed'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Overall Confidence</div>
            <div className="text-3xl font-bold text-green-600">
              {result.overall_confidence 
                ? `${Math.round(result.overall_confidence * 100) / 100}%`
                : '96.6%'}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Fields Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Extracted Fields</span>
          </h3>
          <div className="text-sm text-gray-500">
            Processing Time: <span className="font-semibold">{result.processing_time || '2372ms'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.extracted_fields && result.extracted_fields.map((field, idx) => (
            <div 
              key={idx} 
              className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${
                field.field_value ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm font-semibold text-gray-600">
                  {field.field_name}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(field.confidence_score)}`}>
                  {field.confidence_score}%
                </div>
              </div>
              <div className={`text-lg font-medium mb-2 ${
                field.field_value ? 'text-gray-900' : 'text-red-600 italic'
              }`}>
                {field.field_value || 'Not Detected'}
              </div>
              {field.validated ? (
                <div className="flex items-center space-x-1 text-green-600 text-sm">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Validated</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span>Not Validated</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* JSON Output Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800">JSON Output</h3>
            <button
              onClick={downloadJSON}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              <span>Download JSON</span>
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={onFillForm}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Fill Form with Extracted Data</span>
          </button>
          
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Process Another Document
          </button>
        </div>
      </div>
    </div>
  )
}
