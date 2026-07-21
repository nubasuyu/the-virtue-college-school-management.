import { useState, useEffect, useRef } from 'react';
import api from '../lib/axios';

export default function ReportCard() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/student').then(res => setStudents(res.data)).catch(console.error);
    api.get('/class').then(res => setClasses(res.data)).catch(console.error);
    api.get('/term').then(res => setTerms(res.data)).catch(console.error);
  }, []);

  // Auto-load reports when Class + Term are selected
  useEffect(() => {
    if (selectedClass && selectedTerm) {
      loadClassReports();
    } else if (selectedStudent && selectedTerm) {
      loadSingleReport();
    } else {
      setReportData([]);
    }
  }, [selectedClass, selectedStudent, selectedTerm]);

  const loadSingleReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/report-card/student/${selectedStudent}/term/${selectedTerm}`);
      setReportData([res.data]); // Wrap in array for consistency
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassReports = async () => {
    setLoading(true);
    try {
      const classStudents = students.filter(s => s.currentClassId === selectedClass);
      const reports = [];

      for (const student of classStudents) {
        try {
          const res = await api.get(`/report-card/student/${student.id}/term/${selectedTerm}`);
          reports.push(res.data);
        } catch (err) {
          console.error(`Failed to load report for ${student.firstName}`, err);
        }
      }

      setReportData(reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = selectedClass 
    ? students.filter(s => s.currentClassId === selectedClass) 
    : students;

  return (
    <>
      {/* Controls - Hidden when printing */}
      <div className="print:hidden space-y-4 p-4">
        <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
          
          {/* Select Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select 
              value={selectedClass} 
              onChange={e => {
                setSelectedClass(e.target.value);
                setSelectedStudent(''); // Clear student when class changes
              }}
              className="px-3 py-2 border border-gray-300 rounded-md w-48"
            >
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>

          {/* Select Student (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or Select Specific Student</label>
            <select 
              value={selectedStudent} 
              onChange={e => {
                setSelectedStudent(e.target.value);
                if (e.target.value) setSelectedClass(''); // Clear class if student selected
              }}
              className="px-3 py-2 border border-gray-300 rounded-md w-64"
            >
              <option value="">-- All Students in Class --</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
              ))}
            </select>
          </div>

          {/* Select Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Term</label>
            <select 
              value={selectedTerm} 
              onChange={e => setSelectedTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-48"
            >
              <option value="">-- Select Term --</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.session?.name})</option>)}
            </select>
          </div>

          {/* Print Button */}
          <button 
            onClick={handlePrint}
            disabled={reportData.length === 0 || loading}
            className="bg-brown-800 text-cream-50 px-6 py-2 rounded-md hover:bg-brown-900 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            🖨️ Print {reportData.length > 0 ? `(${reportData.length})` : ''}
          </button>
        </div>

        {loading && (
          <div className="text-center py-10">
            <div className="text-blue-600 font-semibold text-lg">Loading report cards...</div>
            <div className="text-gray-500 text-sm mt-2">Please wait while we fetch all student reports</div>
          </div>
        )}

        {reportData.length > 0 && !loading && (
          <div className="bg-green-50 border border-green-200 p-3 rounded text-green-800">
            ✅ Loaded <strong>{reportData.length}</strong> report card{reportData.length !== 1 ? 's' : ''}. 
            Preview below - click Print when ready.
          </div>
        )}
      </div>

      {/* Report Cards Container */}
      <div ref={printRef} className="space-y-8 p-4">
        {reportData.map((report, index) => (
          <div 
            key={index} 
            className="report-card-container bg-white mx-auto p-4 max-w-4xl shadow-lg print:shadow-none print:max-w-none print:p-0 print:mb-0 break-after-page"
          >
            <ReportCardContent data={report} />
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page { margin: 0.4cm; size: A4 portrait; }
          body * { visibility: hidden; }
          .report-card-container, .report-card-container * { visibility: visible; }
          .report-card-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0; 
            margin: 0; 
            box-shadow: none;
            page-break-after: always;
          }
          .report-card-container:last-child {
            page-break-after: auto;
          }
          .report-card-container table { font-size: 9px !important; }
          .report-card-container th, .report-card-container td { padding: 1px 2px !important; }
          .report-card-container h1 { font-size: 24px !important; }
          .print\\:hidden { display: none !important; }
          .break-after-page { break-after: page; }
        }
      `}</style>
    </>
  );
}

// Reusable Report Card Component
function ReportCardContent({ data }: { data: any }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-brown-800 pb-2 mb-2">
        <img src="/logo.jpg" alt="Logo" className="h-24 w-24 rounded-full object-cover border-2 border-brown-800 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="flex-1 text-center px-4">
          <h1 className="text-4xl font-bold text-brown-800 uppercase tracking-wide leading-tight">THE VIRTUE COLLEGE</h1>
          <p className="text-sm text-red-600 font-bold mt-0.5">GOVERNMENT APPROVED</p>
          <p className="text-xs text-gray-700 mt-0.5">Adebayo Street, Off Oloko - Elere Road, Apata, Ibadan, Oyo State, Nigeria.</p>
          <p className="text-xs font-semibold text-brown-800 italic">Motto: Knowledge Towards Allah's Bliss</p>
          <h2 className="text-base font-bold text-brown-800 mt-1 underline decoration-2 underline-offset-4">REPORT CARD</h2>
        </div>
        <img src="/logo.jpg" alt="Logo" className="h-24 w-24 rounded-full object-cover border-2 border-brown-800 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 mb-3 text-[11px]">
        <div><span className="font-bold text-brown-800">STUDENT NAME:</span> {data.student.name}</div>
        <div><span className="font-bold text-brown-800">ADMISSION NO:</span> {data.student.admissionNo}</div>
        <div><span className="font-bold text-brown-800">CLASS:</span> {data.student.currentClass}</div>
        <div><span className="font-bold text-brown-800">ACADEMIC SESSION:</span> {data.academicInfo.session}</div>
        <div><span className="font-bold text-brown-800">TERM:</span> {data.academicInfo.term}</div>
        <div><span className="font-bold text-brown-800">ATTENDANCE:</span> P: {data.attendance.present} | A: {data.attendance.absent} | L: {data.attendance.late}</div>
      </div>

      {/* Academic Scores Table */}
      <div className="mb-2">
        <table className="w-full text-[11px] border-collapse border-2 border-gray-800">
          <thead>
            <tr className="bg-brown-800 text-cream-50">
              <th className="border-2 border-gray-800 px-1.5 py-1 text-left">SUBJECTS</th>
              <th className="border-2 border-gray-800 px-1 py-1 text-center">1ST C.A<br/>(20)</th>
              <th className="border-2 border-gray-800 px-1 py-1 text-center">2ND C.A<br/>(10)</th>
              <th className="border-2 border-gray-800 px-1 py-1 text-center">EXAM<br/>(70)</th>
              <th className="border-2 border-gray-800 px-1 py-1 text-center font-bold">TOTAL<br/>(100)</th>
              <th className="border-2 border-gray-800 px-1 py-1 text-center">Prev Term<br/>(100)</th>
              <th className="border-2 border-gray-800 px-1 py-1 text-center">AVG</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((sub: any, idx: number) => (
              <tr key={idx} className="break-inside-avoid">
                <td className="border-2 border-gray-800 px-1.5 py-0.5 font-medium uppercase">{sub.subjectName}</td>
                <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{sub.ca1 || '-'}</td>
                <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{sub.ca2 || '-'}</td>
                <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{sub.exam || '-'}</td>
                <td className="border-2 border-gray-800 px-1 py-0.5 text-center font-bold">{sub.total}</td>
                <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{sub.previousTermScore !== null ? sub.previousTermScore : '-'}</td>
                <td className="border-2 border-gray-800 px-1 py-0.5 text-center font-semibold">{sub.average}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold break-inside-avoid">
              <td colSpan={6} className="border-2 border-gray-800 px-2 py-1 text-right text-brown-800">Average:</td>
              <td className="border-2 border-gray-800 px-1 py-1 text-center text-brown-800">{data.finalAverage}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-gray-600 mt-0.5 italic">(Term average are calculated with FULLY GRADED subject only)</p>
      </div>

      {/* Grading Key & Behavior */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-[10px]">
          <h4 className="font-bold text-brown-800 mb-0.5">KEYS TO MARKING & RATING:</h4>
          <p className="text-gray-700 leading-tight">0.0-39.9 POOR; 40.0-49.9 B. AVERAGE; 50.0-54.9 AVERAGE; 55.0-59.9 FAIR; 60.0-69.9 GOOD; 70.0-79.9 V.GOOD; 80.0-100 EXCELLENT;</p>
          <p className="text-gray-700 leading-tight mt-0.5">5, EXCELLENT; 4, HIGH LEVEL; 3, ACCREDITED; 2, MINIMAL LEVEL; 1, BELOW MINIMAL LEVEL</p>
        </div>
        <div>
          <h3 className="text-[11px] font-bold text-brown-800 uppercase mb-0.5">BEHAVIOUR AND SKILLS</h3>
          <table className="w-full text-[10px] border-collapse border-2 border-gray-800">
            <thead>
              <tr className="bg-brown-800 text-cream-50">
                <th className="border-2 border-gray-800 px-1 py-0.5 text-left">RATINGS</th>
                <th className="border-2 border-gray-800 px-1 py-0.5 text-center w-6">5</th>
                <th className="border-2 border-gray-800 px-1 py-0.5 text-center w-6">4</th>
                <th className="border-2 border-gray-800 px-1 py-0.5 text-center w-6">3</th>
                <th className="border-2 border-gray-800 px-1 py-0.5 text-center w-6">2</th>
                <th className="border-2 border-gray-800 px-1 py-0.5 text-center w-6">1</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Attendance', score: data.behavior?.attendance },
                { label: 'Attentiveness', score: data.behavior?.attentiveness },
                { label: 'Cooperation Spirit', score: data.behavior?.cooperation },
                { label: 'Willingness to learn', score: data.behavior?.willingness },
                { label: 'Labour and Workshop', score: data.behavior?.labour },
                { label: 'Leadership Ability', score: data.behavior?.leadership },
                { label: 'Neatness', score: data.behavior?.neatness },
                { label: 'Politeness', score: data.behavior?.politeness },
              ].map((item, idx) => (
                <tr key={idx} className="break-inside-avoid">
                  <td className="border-2 border-gray-800 px-1 py-0.5 font-medium">{item.label}</td>
                  <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{item.score === 5 ? '✓' : ''}</td>
                  <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{item.score === 4 ? '✓' : ''}</td>
                  <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{item.score === 3 ? '✓' : ''}</td>
                  <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{item.score === 2 ? '✓' : ''}</td>
                  <td className="border-2 border-gray-800 px-1 py-0.5 text-center">{item.score === 1 ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments */}
      <div className="mb-3 text-[11px]">
        <h4 className="font-bold text-brown-800 mb-1">Comments</h4>
        <div className="space-y-1">
          <div><span className="font-semibold">Class Teacher's:</span><div className="border-b border-gray-400 mt-0.5 pb-0.5 min-h-[1rem] text-gray-800 italic">{data.comments?.teacherComment || ''}</div></div>
          <div><span className="font-semibold">House Master/Mistress:</span><div className="border-b border-gray-400 mt-0.5 pb-0.5 min-h-[1rem] text-gray-800 italic">{data.comments?.houseMasterComment || ''}</div></div>
          <div><span className="font-semibold">Principal:</span><div className="border-b border-gray-400 mt-0.5 pb-0.5 min-h-[1rem] text-gray-800 italic">{data.comments?.principalComment || ''}</div></div>
        </div>
      </div>

      {/* Signature & Stamp */}
      <div className="flex justify-between items-end mb-3 text-[11px]">
        <div><span className="font-bold text-brown-800">Next Term Begins:</span><span className="ml-2 text-gray-800">{data.comments?.nextTermBegins || '_______________'}</span></div>
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-double border-brown-800 rounded-full flex items-center justify-center text-brown-800 text-[9px] mb-1 font-bold">THE VIRTUE<br/>COLLEGE<br/>STAMP</div>
          <div className="border-t-2 border-gray-800 w-28 pt-0.5 font-bold text-brown-800 text-[10px]">SIGN. ___________<br/>DATE: ___________</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] border-t-2 border-brown-800 pt-1">
        <p className="font-semibold">Tel: 08117242435, 08154761802, 08038646086 | E-mail: virtuetvc2013@gmail.com | website: www.thevirtuecollege.com</p>
      </div>
    </>
  );
}