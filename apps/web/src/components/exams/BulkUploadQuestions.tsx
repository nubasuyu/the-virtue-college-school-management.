'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Props {
  examId: string;
  examName: string;
  authToken: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BulkUploadQuestions({ examId, examName, authToken, onSuccess, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://localhost:3001/exams/${examId}/questions/bulk-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setSuccess(`Successfully uploaded ${data.count} questions!`);
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (type: 'csv' | 'doc') => {
    if (type === 'csv') {
      const csvContent = `Type,Question,MaxPoints,OptionA,OptionB,OptionC,OptionD,CorrectOption,ModelAnswer,Criteria\nMCQ,What is 2 + 2?,5,3,4,5,6,B,,\nTHEORY,Explain photosynthesis.,10,,,,,,Photosynthesis is the process...,"Mentions sunlight (3 pts); Mentions chlorophyll (2 pts)"`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'question_template.csv'; a.click();
    } else {
      const html = `<html><body><h2>Q1. [MCQ] What is 2 + 2? (5 points)</h2><p>A) 3</p><p>B) 4*</p><p>C) 5</p><br><h2>Q2. [THEORY] Explain photosynthesis. (10 points)</h2><p>Model Answer: Plants convert sunlight into food.</p><p>Criteria:</p><p>- Mentions sunlight (3 pts)</p><p>- Mentions chlorophyll (2 pts)</p></body></html>`;
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'question_template.doc'; a.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#4B3621]">Bulk Upload Questions</h2>
            <p className="text-sm text-gray-600">For: <strong>{examName}</strong></p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Templates */}
          <div className="bg-[#FFFDD0]/30 p-4 rounded-lg border border-[#5C4033]/20">
            <h3 className="font-semibold text-[#4B3621] mb-3">1. Download Template</h3>
            <div className="flex gap-3">
              <button onClick={() => downloadTemplate('csv')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <FileSpreadsheet size={16} /> CSV/Excel Template
              </button>
              <button onClick={() => downloadTemplate('doc')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <FileText size={16} /> Word Template
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#5C4033]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[#5C4033] hover:bg-[#FFFDD0]/20 transition"
          >
            <Upload className="mx-auto text-[#5C4033] mb-3" size={32} />
            <p className="text-[#4B3621] font-medium">{file ? file.name : 'Drag & drop file here, or click to browse'}</p>
            <p className="text-xs text-gray-500 mt-1">Supported: .xlsx, .csv, .docx (Max 5MB)</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.docx,.doc" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-800 text-sm whitespace-pre-wrap">{error}</div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <div className="text-green-800">{success}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={onCancel} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#5C4033] text-[#FFFDD0] rounded-lg hover:bg-[#4B3621] transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : <><Upload size={18} /> Upload & Import</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}