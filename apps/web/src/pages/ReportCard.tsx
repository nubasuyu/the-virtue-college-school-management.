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
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // Parse user ONCE to avoid infinite loops
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;
  const isViewer = role === 'PARENT' || role === 'STUDENT';

  //  CRITICAL FIX: Empty dependency array [] prevents the infinite loop!
  useEffect(() => {
    if (!isViewer) {
      api.get('/student').then(res => setStudents(res.data)).catch(console.error);
      api.get('/class').then(res => setClasses(res.data)).catch(console.error);
    }

    api.get('/term').then(res => {
      setTerms(res.data);
      
      if (isViewer && res.data.length > 0) {
        // Sort to find the latest term
        const latestTerm = res.data.sort((a: any, b: any) => 
          new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
        )[0];
        
        // 👇 DYNAMICALLY get the first child's ID from the user object
        const viewerStudentId = role === 'PARENT' ? user?.children?.[0]?.id : user?.userId;

        console.log(' Auto-selecting - Term:', latestTerm?.id, 'Student:', viewerStudentId);

        if (latestTerm?.id && viewerStudentId) {
          setSelectedTerm(latestTerm.id);
          setSelectedStudent(viewerStudentId);

          // Fetch report directly to avoid state lag
          api.get(`/report-card/student/${viewerStudentId}/term/${latestTerm.id}`)
            .then(reportRes => {
              console.log('✅ Auto-loaded report:', reportRes.data);
              setReportData([reportRes.data]);
            })
            .catch(err => {
              console.error('❌ Auto-load failed:', err);
              setReportData([]);
            })
            .finally(() => setLoading(false));
        } else {
          // Fallback if no children are linked to the parent account yet
          setReportData([]);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load terms', err);
      setLoading(false);
    });
  }, []); //  EMPTY ARRAY STOPS THE LOOP

  // Manual load for when user changes dropdowns
  const loadSingleReport = async () => {
    if (!selectedStudent || !selectedTerm) return;
    setLoading(true);
    try {
      const res = await api.get(`/report-card/student/${selectedStudent}/term/${selectedTerm}`);
      setReportData([res.data]);
    } catch (err) {
      console.error('Failed to load report', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassReports = async () => {
    if (!selectedClass || !selectedTerm) return;
    setLoading(true);
    try {
      const classStudents = students.filter(s => s.currentClassId === selectedClass);
      const reports = [];
      for (const student of classStudents) {
        try {
          const res = await api.get(`/report-card/student/${student.id}/term/${selectedTerm}`);
          reports.push(res.data);
        } catch (err) { console.error(err); }
      }
      setReportData(reports);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // Trigger manual loads when dropdowns change (only for non-viewers or manual term changes)
  useEffect(() => {
    if (!isViewer) {
      if (selectedClass && selectedTerm) loadClassReports();
      else if (selectedStudent && selectedTerm) loadSingleReport();
    }
  }, [selectedClass, selectedStudent, selectedTerm]);

  const handlePrint = () => window.print();
  const filteredStudents = selectedClass ? students.filter(s => s.currentClassId === selectedClass) : students;

  return (
    <>
      {/* ADMIN/TEACHER CONTROLS */}
      {!isViewer && (
        <div className="print:hidden space-y-4 p-4">
          <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); }} className="px-3 py-2 border border-gray-300 rounded-md w-48">
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Or Select Specific Student</label>
              <select value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); if (e.target.value) setSelectedClass(''); }} className="px-3 py-2 border border-gray-300 rounded-md w-64">
                <option value="">-- All Students in Class --</option>
                {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Term</label>
              <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md w-48">
                <option value="">-- Select Term --</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.session?.name})</option>)}
              </select>
            </div>
            <button onClick={handlePrint} disabled={reportData.length === 0 || loading} className="bg-[#5C4033] text-[#FFFDD0] px-6 py-2 rounded-md hover:bg-[#4B3621] transition disabled:opacity-50 font-semibold">
              🖨️ Print {reportData.length > 0 ? `(${reportData.length})` : ''}
            </button>
          </div>
        </div>
      )}

      {/* PARENT/STUDENT CONTROLS */}
      {isViewer && (
        <div className="print:hidden space-y-4 p-4">
          <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Term</label>
              <select value={selectedTerm} onChange={e => {
                setSelectedTerm(e.target.value);
                if (e.target.value && selectedStudent) {
                  setLoading(true);
                  api.get(`/report-card/student/${selectedStudent}/term/${e.target.value}`)
                    .then(res => setReportData([res.data]))
                    .catch(err => setReportData([]))
                    .finally(() => setLoading(false));
                }
              }} className="px-3 py-2 border border-gray-300 rounded-md w-48">
                <option value="">-- Select Term --</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.session?.name})</option>)}
              </select>
            </div>
            <button onClick={handlePrint} disabled={reportData.length === 0 || loading} className="bg-[#5C4033] text-[#FFFDD0] px-6 py-2 rounded-md hover:bg-[#4B3621] transition disabled:opacity-50 font-semibold">
              🖨️ Print Report Card
            </button>
          </div>
        </div>
      )}

      {loading && <div className="text-center py-10 text-[#5C4033] font-semibold text-lg">Loading report card...</div>}

      {!loading && reportData.length > 0 && (
        <div className="bg-green-50 border border-green-200 p-3 rounded text-green-800 mx-4 print:hidden">
          ✅ Report card loaded. Preview below - click Print when ready.
        </div>
      )}

      <div ref={printRef} className="space-y-8 p-4">
        {reportData.map((report, index) => (
          <div key={index} className="report-card-container bg-white mx-auto p-4 max-w-4xl shadow-lg print:shadow-none print:max-w-none print:p-0 print:mb-0 break-after-page">
            <ReportCardContent data={report} />
          </div>
        ))}
        {reportData.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow mx-4">
            {isViewer && !user?.children?.[0]?.id 
              ? "No children are currently linked to your parent account. Please contact the school administration." 
              : "No report card data found for the selected term. Please ensure grades have been published by the teacher."}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { margin: 0.4cm; size: A4 portrait; }
          body * { visibility: hidden; }
          .report-card-container, .report-card-container * { visibility: visible; }
          .report-card-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; box-shadow: none; page-break-after: always; }
          .report-card-container:last-child { page-break-after: auto; }
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
      <div className="flex items-center justify-between border-b-4 border-[#5C4033] pb-2 mb-2">
        <img src="/logo.jpg" alt="Logo" className="h-24 w-24 rounded-full object-cover border-2 border-[#5C4033] flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="flex-1 text-center px-4">
          <h1 className="text-4xl font-bold text-[#5C4033] uppercase tracking-wide leading-tight">THE VIRTUE COLLEGE</h1>
          <p className="text-sm text-red-600 font-bold mt-0.5">GOVERNMENT APPROVED</p>
          <p className="text-xs text-gray-700 mt-0.5">Adebayo Street, Off Oloko - Elere Road, Apata, Ibadan, Oyo State, Nigeria.</p>
          <p className="text-xs font-semibold text-[#5C4033] italic">Motto: Knowledge Towards Allah's Bliss</p>
          <h2 className="text-base font-bold text-[#5C4033] mt-1 underline decoration-2 underline-offset-4">REPORT CARD</h2>
        </div>
        <img src="/logo.jpg" alt="Logo" className="h-24 w-24 rounded-full object-cover border-2 border-[#5C4033] flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-1 mb-3 text-[11px]">
        <div><span className="font-bold text-[#5C4033]">STUDENT NAME:</span> {data.student.name}</div>
        <div><span className="font-bold text-[#5C4033]">ADMISSION NO:</span> {data.student.admissionNo}</div>
        <div><span className="font-bold text-[#5C4033]">CLASS:</span> {data.student.currentClass}</div>
        <div><span className="font-bold text-[#5C4033]">ACADEMIC SESSION:</span> {data.academicInfo.session}</div>
        <div><span className="font-bold text-[#5C4033]">TERM:</span> {data.academicInfo.term}</div>
        <div><span className="font-bold text-[#5C4033]">ATTENDANCE:</span> P: {data.attendance.present} | A: {data.attendance.absent} | L: {data.attendance.late}</div>
      </div>

      <div className="mb-2">
        <table className="w-full text-[11px] border-collapse border-2 border-gray-800">
          <thead>
            <tr className="bg-[#5C4033] text-[#FFFDD0]">
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
              <td colSpan={6} className="border-2 border-gray-800 px-2 py-1 text-right text-[#5C4033]">Average:</td>
              <td className="border-2 border-gray-800 px-1 py-1 text-center text-[#5C4033]">{data.finalAverage}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-gray-600 mt-0.5 italic">(Term average are calculated with FULLY GRADED subject only)</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-[10px]">
          <h4 className="font-bold text-[#5C4033] mb-0.5">KEYS TO MARKING & RATING:</h4>
          <p className="text-gray-700 leading-tight">0.0-39.9 POOR; 40.0-49.9 B. AVERAGE; 50.0-54.9 AVERAGE; 55.0-59.9 FAIR; 60.0-69.9 GOOD; 70.0-79.9 V.GOOD; 80.0-100 EXCELLENT;</p>
          <p className="text-gray-700 leading-tight mt-0.5">5, EXCELLENT; 4, HIGH LEVEL; 3, ACCREDITED; 2, MINIMAL LEVEL; 1, BELOW MINIMAL LEVEL</p>
        </div>
        <div>
          <h3 className="text-[11px] font-bold text-[#5C4033] uppercase mb-0.5">BEHAVIOUR AND SKILLS</h3>
          <table className="w-full text-[10px] border-collapse border-2 border-gray-800">
            <thead>
              <tr className="bg-[#5C4033] text-[#FFFDD0]">
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

      <div className="mb-3 text-[11px]">
        <h4 className="font-bold text-[#5C4033] mb-1">Comments</h4>
        <div className="space-y-1">
          <div><span className="font-semibold">Class Teacher's:</span><div className="border-b border-gray-400 mt-0.5 pb-0.5 min-h-[1rem] text-gray-800 italic">{data.comments?.teacherComment || ''}</div></div>
          <div><span className="font-semibold">House Master/Mistress:</span><div className="border-b border-gray-400 mt-0.5 pb-0.5 min-h-[1rem] text-gray-800 italic">{data.comments?.houseMasterComment || ''}</div></div>
          <div><span className="font-semibold">Principal:</span><div className="border-b border-gray-400 mt-0.5 pb-0.5 min-h-[1rem] text-gray-800 italic">{data.comments?.principalComment || ''}</div></div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-3 text-[11px]">
        <div><span className="font-bold text-[#5C4033]">Next Term Begins:</span><span className="ml-2 text-gray-800">{data.comments?.nextTermBegins || '_______________'}</span></div>
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-double border-[#5C4033] rounded-full flex items-center justify-center text-[#5C4033] text-[9px] mb-1 font-bold">THE VIRTUE<br/>COLLEGE<br/>STAMP</div>
          <div className="border-t-2 border-gray-800 w-28 pt-0.5 font-bold text-[#5C4033] text-[10px]">SIGN. ___________<br/>DATE: ___________</div>
        </div>
      </div>

      <div className="text-center text-[10px] border-t-2 border-[#5C4033] pt-1">
        <p className="font-semibold">Tel: 08117242435, 08154761802, 08038646086 | E-mail: virtuetvc2013@gmail.com | website: www.thevirtuecollege.com</p>
      </div>
    </>
  );
}