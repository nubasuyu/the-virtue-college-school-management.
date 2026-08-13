import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender: string;
  className?: string; // Assuming you might have this
  photoUrl?: string;
}

interface StudentIdCardProps {
  student: Student;
  onClose: () => void;
}

export default function StudentIdCard({ student, onClose }: StudentIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `ID_Card_${student.admissionNo}`,
  });

  // The QR code will encode the admission number for easy scanning
  const qrValue = student.admissionNo;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-cream-50">
          <h2 className="text-xl font-bold text-brown-800">Student ID Card</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex flex-col items-center gap-8">
          
          {/* The Actual ID Card (This is what gets printed) */}
                    {/* The Actual ID Card (This is what gets printed) */}
          <div 
            ref={cardRef} 
              className="w-[350px] h-[220px] bg-cream-50 border-4 border-brown-800 rounded-xl shadow-lg overflow-hidden relative flex flex-col"
              // 👇 ADD THIS STYLE LINE TO FORCE COLOR PRINTING
            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
          >
            {/* Card Header */}
            <div className="bg-brown-800 p-3 flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="w-10 h-10 rounded-full object-cover border-2 border-cream-50" 
              />
              <div>
                <h3 className="text-cream-50 font-bold text-sm leading-tight">THE VIRTUE COLLEGE</h3>
                <p className="text-cream-100 text-xs">Student Identity Card</p>
              </div>
            </div>

            {/* Card Body */}
            <div className="flex-1 p-4 flex gap-4">
              {/* Photo Area */}
              <div className="w-24 h-28 bg-gray-200 rounded-lg border-2 border-brown-800 overflow-hidden flex-shrink-0">
                <img 
                  src={student.photoUrl || 'https://via.placeholder.com/150?text=Photo'} 
                  alt="Student" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details Area */}
              <div className="flex-1 flex flex-col justify-center space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Name</p>
                <p className="text-brown-800 font-bold text-lg leading-tight">
                  {student.firstName} {student.lastName}
                </p>
                
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-2">Admission No</p>
                <p className="text-brown-800 font-mono font-bold text-base">{student.admissionNo}</p>
                
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-2">Gender</p>
                <p className="text-brown-800 font-medium text-sm">{student.gender}</p>
              </div>
            </div>

            {/* Card Footer / QR Code */}
            <div className="absolute bottom-2 right-3 bg-white p-1 rounded-lg border border-gray-200">
              <QRCodeSVG value={qrValue} size={50} level="H" />
            </div>
            
            {/* Decorative bottom strip */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brown-800"></div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-brown-800 text-cream-50 px-6 py-3 rounded-lg hover:bg-brown-900 transition-colors font-semibold shadow-md"
            >
              <Printer className="w-5 h-5" />
              Print ID Card
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}