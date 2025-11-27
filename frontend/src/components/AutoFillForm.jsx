import React, { useState } from 'react'

export default function AutoFillForm({ result, onBack, onReset }) {
  const [formData, setFormData] = useState(() => {
    const data = {}
    if (result.extracted_fields) {
      result.extracted_fields.forEach(field => {
        data[field.field_name] = field.field_value
      })
    }
    return data
  })

  const documentType = result.document_type || 'passport'

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Form submitted successfully!\n\nIn a real application, this would send the data to your backend.')
    console.log('Form data:', formData)
  }

  const getFieldData = (fieldName) => {
    const field = result.extracted_fields?.find(f => f.field_name === fieldName)
    return field || null
  }

  const renderField = (label, fieldName, readOnly = false) => {
    const field = getFieldData(fieldName)
    const confidence = field?.confidence_score || 0
    const validated = field?.validated || false
    const hasValue = formData[fieldName] && formData[fieldName].trim() !== ''

    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {!hasValue && <span className="text-red-500 text-xs">(Missing)</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData[fieldName] || ''}
            onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
            readOnly={readOnly}
            placeholder={!hasValue ? 'Not detected - Please enter manually' : ''}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-20 ${
              validated ? 'border-green-300 bg-green-50' : 
              !hasValue ? 'border-red-300 bg-red-50' : 
              'border-gray-300'
            } ${readOnly ? 'bg-gray-50' : ''}`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {validated ? (
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            ) : !hasValue ? (
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            ) : null}
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              confidence >= 95 ? 'bg-green-100 text-green-800' :
              confidence >= 90 ? 'bg-blue-100 text-blue-800' :
              confidence > 0 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {confidence > 0 ? `${confidence.toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Get document-specific configuration
  const getDocumentConfig = () => {
    switch(documentType) {
      case 'passport':
        return {
          title: 'Passport Information Form',
          subtitle: 'Auto-filled from extracted passport data',
          sections: [
            {
              title: 'Personal Information',
              color: 'blue',
              fields: [
                { label: 'Surname', field: 'Surname' },
                { label: 'Given Names', field: 'Given Names' },
                { label: 'Date of Birth', field: 'Date of Birth' },
                { label: 'Gender', field: 'Gender' },
                { label: 'Nationality', field: 'Nationality' }
              ]
            },
            {
              title: 'Passport Details',
              color: 'green',
              fields: [
                { label: 'Passport Number', field: 'Passport Number' },
                { label: 'Date of Issue', field: 'Date of Issue' },
                { label: 'Date of Expiry', field: 'Date of Expiry' }
              ]
            }
          ]
        }
      
      case 'aadhar':
        return {
          title: 'Aadhar Card Information Form',
          subtitle: 'Auto-filled from extracted Aadhar card data',
          sections: [
            {
              title: 'Personal Information',
              color: 'blue',
              fields: [
                { label: 'Full Name', field: 'Name' },
                { label: 'Father\'s Name', field: 'Father Name' },
                { label: 'Date of Birth / Age', field: 'Date of Birth' },
                { label: 'Gender', field: 'Gender' }
              ]
            },
            {
              title: 'Aadhar Details',
              color: 'green',
              fields: [
                { label: 'Aadhar Number', field: 'Aadhaar Number' }
              ]
            },
            {
              title: 'Address Information',
              color: 'purple',
              fields: [
                { label: 'Address', field: 'Address' },
                { label: 'PIN Code', field: 'PIN Code' },
                { label: 'State', field: 'State' }
              ]
            }
          ]
        }
      
      case 'driving_license':
        return {
          title: 'Driving License Information Form',
          subtitle: 'Auto-filled from extracted driving license data',
          sections: [
            {
              title: 'Personal Information',
              color: 'blue',
              fields: [
                { label: 'Full Name', field: 'Name' },
                { label: 'Father\'s / Husband\'s Name', field: 'Father/Husband Name' },
                { label: 'Date of Birth', field: 'Date of Birth' },
                { label: 'Gender', field: 'Gender' },
                { label: 'Blood Group', field: 'Blood Group' }
              ]
            },
            {
              title: 'License Details',
              color: 'green',
              fields: [
                { label: 'License Number', field: 'DL Number' },
                { label: 'Date of Issue', field: 'Date of Issue' },
                { label: 'Valid Until', field: 'Valid Upto' },
                { label: 'Vehicle Class', field: 'Vehicle Class' }
              ]
            },
            {
              title: 'Address Information',
              color: 'purple',
              fields: [
                { label: 'Address', field: 'Address' },
                { label: 'State', field: 'State' },
                { label: 'PIN Code', field: 'PIN Code' }
              ]
            }
          ]
        }
      
      default:
        return {
          title: 'Document Information Form',
          subtitle: 'Auto-filled from extracted document data',
          sections: [
            {
              title: 'Extracted Information',
              color: 'blue',
              fields: result.extracted_fields?.map(f => ({ 
                label: f.field_name, 
                field: f.field_name 
              })) || []
            }
          ]
        }
    }
  }

  const config = getDocumentConfig()

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{config.title}</h2>
        <p className="text-indigo-100 mt-1">{config.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {/* Dynamic Sections */}
        {config.sections.map((section, idx) => {
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200',
            green: 'bg-green-50 border-green-200',
            purple: 'bg-purple-50 border-purple-200',
            gray: 'bg-gray-50 border-gray-200'
          }
          
          return (
            <div key={idx} className={`${colorClasses[section.color]} border rounded-lg p-6 mb-6`}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">{section.title}</h3>
              
              <div className={`grid grid-cols-1 ${section.fields.length > 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
                {section.fields.map((field, fieldIdx) => (
                  <div key={fieldIdx}>
                    {renderField(field.label, field.field, field.readOnly)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Validation Notice */}
        {(() => {
          const missingFields = Object.entries(formData).filter(([_, value]) => !value || value.trim() === '')
          const allFilled = missingFields.length === 0
          
          return allFilled ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
              <svg className="h-6 w-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <div>
                <h4 className="font-semibold text-green-800">All fields validated and auto-filled</h4>
                <p className="text-sm text-green-700">Review the information above and click Submit when ready</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <svg className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <div>
                <h4 className="font-semibold text-yellow-800">Some fields could not be detected</h4>
                <p className="text-sm text-yellow-700 mb-2">Please fill in the missing information manually before submitting:</p>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  {missingFields.map(([fieldName, _]) => (
                    <li key={fieldName}>{fieldName}</li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })()}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
          >
            Submit Form
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Back to Results
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Process Another Document
          </button>
        </div>
      </form>
    </div>
  )
}
