import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../lib/axios';

export default function BulkUploadStudents() {
  const [file, setFile] = useState<File | null>(null);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    api.get('/class').then(res => setClasses(res.data)).catch(console.error);
  }, []);

  const downloadTemplate = () => {
    const headers = ['firstName', 'lastName', 'admissionNo', 'gender', 'dateOfBirth', 'parentFirstName', 'parentLastName', 'parentPhone', 'parentEmail', 'parentRelation'];
    const csvContent = headers.join(',') + '\nJohn,Doe,TVC20250099,MALE,2010-05-15,Jane,Doe,08012345678,jane@example.com,Mother';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_bulk_upload_template.csv';
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setResults(null); // Reset results on new file
    }
  };

  const handleUpload = async () => {
    if (!file || !classId) {
      alert('Please select a file and a class.');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await api.post('/student/bulk-upload', {
            classId,
            students: results.data,
          });
          setResults(response.data);
        } catch (error) {
          console.error(error);
          alert('Failed to process file. Please check the format.');
        } finally {
          setIsProcessing(false);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error parsing CSV file.');
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Bulk Upload Students</h2>

      {/* Instructions & Template */}
      <div className="mb-8 p-4 bg-cream-50 rounded-lg border border-brown-800/20">
        <h3 className="font-semibold text-brown-800 mb-2">How to use:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 mb-4">
          <li>Download the CSV template below.</li>
          <li>Fill in the student details (do not change the header row).</li>
          <li>Select the class you want to assign these students to.</li>
          <li>Upload the completed CSV file.</li>
        </ol>
        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-brown-800 font-medium hover:underline"
        >
          <Download className="w-4 h-4" /> Download CSV Template
        </button>
      </div>

      {/* Upload Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Assign to Class *</label>
          <select 
            value={classId} 
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800"
          >
            <option value="">Select a Class</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Upload CSV File *</label>
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brown-800 file:text-cream-50 hover:file:bg-brown-900"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || !classId || isProcessing}
        className="w-full bg-brown-800 text-cream-50 py-3 rounded-lg font-semibold hover:bg-brown-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-cream-50 border-t-transparent"></div>
            Processing...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" /> Upload & Process Students
          </>
        )}
      </button>

      {/* Results Summary */}
      {results && (
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-800 font-medium">Successful</p>
                <p className="text-2xl font-bold text-green-700">{results.success}</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-800 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-700">{results.failed}</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Total Processed</p>
                <p className="text-2xl font-bold text-blue-700">{results.success + results.failed}</p>
              </div>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-bold text-red-800 mb-2">Error Details:</h4>
              <ul className="space-y-2 text-sm text-red-700">
                {results.errors.map((err: any, idx: number) => (
                  <li key={idx} className="flex justify-between border-b border-red-100 pb-1">
                    <span><strong>{err.name}</strong> ({err.admissionNo})</span>
                    <span className="text-red-600">{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}