import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function DocumentViewer({ onBack }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const res = await axios.get('http://localhost:5000/api/documents')
      setDocuments(res.data.documents)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return
    
    try {
      setDeleting(filename)
      await axios.delete(`http://localhost:5000/api/documents/${filename}`)
      await fetchDocuments()
      if (selectedDoc === filename) setSelectedDoc(null)
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.error || err.message))
    } finally {
      setDeleting(null)
    }
  }

  const getDocTypeLabel = (docType) => {
    const labels = {
      passport: 'Passport',
      aadhar: 'Aadhar',
      driving_license: 'Driving License',
      unknown: 'Unknown'
    }
    return labels[docType] || 'Unknown'
  }

  const getDocTypeColor = (docType) => {
    const colors = {
      passport: 'bg-blue-100 text-blue-800',
      aadhar: 'bg-green-100 text-green-800',
      driving_license: 'bg-purple-100 text-purple-800',
      unknown: 'bg-gray-100 text-gray-800'
    }
    return colors[docType] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (selectedDoc) {
    return (
      <div className="bg-white shadow-xl rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Document Preview</h2>
          <button
            onClick={() => setSelectedDoc(null)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Back to List
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">Filename: {selectedDoc}</p>
        </div>

        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <img
            src={`http://localhost:5000/api/documents/${selectedDoc}`}
            alt={selectedDoc}
            className="w-full h-auto"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <div style={{ display: 'none' }} className="p-8 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="text-gray-600">Unable to preview this document format</p>
            <a
              href={`http://localhost:5000/api/documents/${selectedDoc}`}
              download
              className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Download Document
            </a>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Back to Upload
          </button>
          <button
            onClick={() => deleteDocument(selectedDoc)}
            disabled={deleting === selectedDoc}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 font-semibold transition"
          >
            {deleting === selectedDoc ? 'Deleting...' : 'Delete Document'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Uploaded Documents</h2>
          <p className="text-gray-600 mt-1">View and manage your uploaded documents</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
        >
          Back to Upload
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading documents...</span>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="text-center py-12">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Documents Yet</h3>
          <p className="text-gray-500">Upload your first document to get started</p>
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            Total Documents: {documents.length}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.filename}
                className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedDoc(doc.filename)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDocTypeColor(doc.docType)}`}>
                    {getDocTypeLabel(doc.docType)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteDocument(doc.filename)
                    }}
                    disabled={deleting === doc.filename}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                  >
                    {deleting === doc.filename ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    )}
                  </button>
                </div>

                <div className="aspect-video bg-gray-100 rounded mb-3 overflow-hidden">
                  <img
                    src={`http://localhost:5000/api/documents/${doc.filename}`}
                    alt={doc.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ob1ByZXZpZXc8L3RleHQ+PC9zdmc+'
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-800 truncate" title={doc.filename}>
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(doc.uploadDate)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Size: {formatSize(doc.size)}
                  </p>
                </div>

                <button
                  className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDoc(doc.filename)
                  }}
                >
                  View Document
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
