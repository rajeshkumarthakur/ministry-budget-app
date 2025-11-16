// src/components/Forms/FormExport.jsx
import React from 'react';
import { Download, FileText, File } from 'lucide-react';

const FormExport = ({ formId, formNumber, ministryName, status }) => {
  const [exporting, setExporting] = React.useState(false);
  const [exportType, setExportType] = React.useState('');

  const handleExport = async (type) => {
    setExporting(true);
    setExportType(type);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/forms/${formId}/export/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Form-${formNumber}-${ministryName.replace(/\s+/g, '-')}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting form:', error);
      alert('Failed to export form. Please try again.');
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Export Form
          </h3>
          <p className="text-xs text-gray-500">
            Download as PDF or Word document
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {exporting && exportType === 'pdf' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => handleExport('docx')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {exporting && exportType === 'docx' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <File className="w-4 h-4" />
                <span>Export Word</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormExport;
