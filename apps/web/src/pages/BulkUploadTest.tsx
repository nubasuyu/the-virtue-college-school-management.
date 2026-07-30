import { useState } from 'react';
import BulkUploadQuestions from '../components/exams/BulkUploadQuestions';

export default function BulkUploadTest() {
  const [showModal, setShowModal] = useState(false);

  // Use a real exam ID from your seeded database, or a dummy one to test the UI
  const testExamId = "d745f5a5-b6a7-4aa7-9eba-1bc38d81ba3b"; 
  // const authToken = localStorage.getItem('authToken') || 'dummy-token-for-ui-test';
  // Replace the old line with this:
const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZDIzMDliYS0zM2UxLTRkM2QtOTIwMC1lYTZiOTM2OWE2OGEiLCJlbWFpbCI6ImFkbWluQHZpcnR1ZWNvbGxlZ2UuZWR1Iiwicm9sZSI6IlNVUEVSX0FETUlOIiwidGVuYW50SWQiOiJkNmY5MWY1Mi0yNDMwLTQ0ZDctYmNkOC0yMDdhZWJhYzdkZDMiLCJpYXQiOjE3ODQ5NDM0MjcsImV4cCI6MTc4NTU0ODIyN30.KoE-W9ObxFkPm-Bp8Mj1FWG7x0iPuAeLPTKz_rD2yV8";
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#4B3621] mb-4">Bulk Upload Test Page</h1>
      <p className="mb-6 text-gray-600">Click the button below to test the bulk question upload modal.</p>
      
      <button 
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-[#5C4033] text-[#FFFDD0] rounded-lg hover:bg-[#4B3621] font-semibold"
      >
        Open Bulk Upload Modal
      </button>

      {showModal && (
        <BulkUploadQuestions
          examId={testExamId}
          examName="Test Mathematics Exam"
          authToken={authToken}
          onSuccess={() => {
            setShowModal(false);
            alert("Success! Check your database.");
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}