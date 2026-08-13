import { useState, useEffect } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, User, GraduationCap, Home, Heart, CheckCircle } from 'lucide-react';
import api from '../lib/axios';

interface AddStudentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentSaved: () => void;
  editStudent?: any | null; // 👈 NEW: Added for editing
}

export default function AddStudentWizard({ isOpen, onClose, onStudentSaved, editStudent }: AddStudentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);

  const isEditing = !!editStudent;

  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', dateOfBirth: '', gender: 'MALE', nationality: '',
    admissionNo: '', currentClassId: '', enrollmentSession: '2025/2026', enrollmentTerm: 1, previousSchool: '',
    parentFirstName: '', parentLastName: '', parentPhone: '', parentEmail: '', parentRelation: 'Father',
    residentialAddress: '', city: '', state: '', country: 'Nigeria',
    emergencyContactName: '', emergencyContactPhone: '', knownAllergies: '', chronicConditions: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/class').then(res => setClasses(res.data)).catch(console.error);
      
      // 👈 NEW: Pre-fill form if editing
      if (isEditing) {
        setFormData({
          firstName: editStudent.firstName || '',
          lastName: editStudent.lastName || '',
          middleName: editStudent.middleName || '',
          dateOfBirth: editStudent.dateOfBirth ? editStudent.dateOfBirth.split('T')[0] : '',
          gender: editStudent.gender || 'MALE',
          nationality: editStudent.nationality || '',
          admissionNo: editStudent.admissionNo || '',
          currentClassId: editStudent.currentClassId || '',
          enrollmentSession: editStudent.enrollmentSession || '2025/2026',
          enrollmentTerm: editStudent.enrollmentTerm || 1,
          previousSchool: editStudent.previousSchool || '',
          residentialAddress: editStudent.residentialAddress || '',
          city: editStudent.city || '',
          state: editStudent.state || '',
          country: editStudent.country || 'Nigeria',
          emergencyContactName: editStudent.emergencyContactName || '',
          emergencyContactPhone: editStudent.emergencyContactPhone || '',
          knownAllergies: editStudent.knownAllergies || '',
          chronicConditions: editStudent.chronicConditions || '',
          // Note: Parent data might not be fully populated in the student object, 
          // so we leave parent fields blank for editing, or you can fetch them if needed.
          parentFirstName: '', parentLastName: '', parentPhone: '', parentEmail: '', parentRelation: 'Father',
        });
        setPhotoPreview(editStudent.photoUrl || null);
      } else {
        // Reset for adding new
        setFormData({
          firstName: '', lastName: '', middleName: '', dateOfBirth: '', gender: 'MALE', nationality: '',
          admissionNo: '', currentClassId: '', enrollmentSession: '2025/2026', enrollmentTerm: 1, previousSchool: '',
          parentFirstName: '', parentLastName: '', parentPhone: '', parentEmail: '', parentRelation: 'Father',
          residentialAddress: '', city: '', state: '', country: 'Nigeria',
          emergencyContactName: '', emergencyContactPhone: '', knownAllergies: '', chronicConditions: '',
        });
        setPhotoFile(null);
        setPhotoPreview(null);
      }
      setCurrentStep(1); // Always start at step 1 when opened
    }
  }, [isOpen, editStudent, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let finalPhotoUrl = editStudent?.photoUrl || '';
      
      // 1. Upload Photo if a new one is selected
      if (photoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', photoFile);
        const uploadRes = await api.post('/upload/file', uploadFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        finalPhotoUrl = uploadRes.data.url || uploadRes.data.filePath || uploadRes.data;
      }

      // 2. Prepare Student Payload
      const studentPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality || undefined,
        admissionNo: formData.admissionNo,
        currentClassId: formData.currentClassId,
        enrollmentSession: formData.enrollmentSession,
        enrollmentTerm: formData.enrollmentTerm,
        previousSchool: formData.previousSchool || undefined,
        residentialAddress: formData.residentialAddress || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        knownAllergies: formData.knownAllergies || undefined,
        chronicConditions: formData.chronicConditions || undefined,
        photoUrl: finalPhotoUrl || undefined,
      };

      console.log("📸 FINAL PHOTO URL BEING SAVED:", finalPhotoUrl);
      console.log("📦 FULL STUDENT PAYLOAD:", studentPayload);
      // 3. Create or Update Student
      if (isEditing) {
        await api.put(`/student/${editStudent.id}`, studentPayload);
      } else {
        const studentRes = await api.post('/student', studentPayload);
        const newStudentId = studentRes.data.id;

        // 4. Create Parent and Link to Student (ONLY when adding new)
        if (formData.parentFirstName && formData.parentPhone) {
          await api.post('/parents', {
            firstName: formData.parentFirstName,
            lastName: formData.parentLastName,
            phone: formData.parentPhone,
            email: formData.parentEmail || undefined,
            relation: formData.parentRelation,
            studentIds: [newStudentId], 
            createPortalAccount: !!formData.parentEmail,
            password: 'parent123', 
          });
        }
      }

      onStudentSaved();
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to save student. Please check all required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-brown-800 text-cream-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{isEditing ? 'Edit Student' : 'New Student Onboarding'}</h2>
            <p className="text-cream-100 text-sm mt-1">Step {currentStep} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brown-900 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="bg-brown-800 h-2 transition-all duration-300 ease-in-out" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-brown-800 font-bold text-lg mb-4">
                <User className="w-5 h-5" /> Personal Information
              </div>
              
              <div className="flex flex-col items-center gap-4 mb-8 p-6 bg-cream-50 rounded-xl border-2 border-dashed border-brown-800/30">
                <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-brown-800 flex items-center justify-center overflow-hidden shadow-md">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer bg-brown-800 text-cream-50 px-6 py-2 rounded-lg hover:bg-brown-900 transition font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> {photoPreview ? 'Change Photo' : 'Upload Passport Photo'}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Middle Name</label>
                  <input name="middleName" value={formData.middleName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
                  <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nationality</label>
                  <input name="nationality" value={formData.nationality} onChange={handleChange} placeholder="e.g., Nigerian" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Academic Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-brown-800 font-bold text-lg mb-4">
                <GraduationCap className="w-5 h-5" /> Academic Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Number *</label>
                  <input required name="admissionNo" value={formData.admissionNo} onChange={handleChange} placeholder="e.g., TVC20250001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Class *</label>
                  <select required name="currentClassId" value={formData.currentClassId} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent">
                    <option value="">Select a Class</option>
                    {classes.map((cls: any) => <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Enrollment Session *</label>
                  <select required name="enrollmentSession" value={formData.enrollmentSession} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent">
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Enrollment Term *</label>
                  <select required name="enrollmentTerm" value={formData.enrollmentTerm} onChange={(e) => setFormData({...formData, enrollmentTerm: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent">
                    <option value={1}>First Term</option>
                    <option value={2}>Second Term</option>
                    <option value={3}>Third Term</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Previous School (Optional)</label>
                  <input name="previousSchool" value={formData.previousSchool} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Parent Info (Skipped if editing, or shown as read-only/optional) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-brown-800 font-bold text-lg mb-4">
                <User className="w-5 h-5" /> Primary Parent / Guardian
              </div>
              {isEditing ? (
                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                  <p className="font-medium">Note: Parent information is managed separately. To update parent details, please use the "Parents" management page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Parent First Name *</label>
                    <input required name="parentFirstName" value={formData.parentFirstName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Last Name *</label>
                    <input required name="parentLastName" value={formData.parentLastName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Relationship *</label>
                    <select required name="parentRelation" value={formData.parentRelation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent">
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Legal Guardian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <input required type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address (Optional - creates Parent Portal account)</label>
                    <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} placeholder="parent@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Contact & Medical */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-brown-800 font-bold text-lg mb-4">
                <Home className="w-5 h-5" /> Contact & Medical Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Residential Address *</label>
                  <textarea required name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                  <input required name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                  <input required name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-md mb-4">
                    <Heart className="w-5 h-5" /> Emergency & Medical
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact Name *</label>
                  <input required name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact Phone *</label>
                  <input required type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Known Allergies / Medical Conditions</label>
                  <textarea name="knownAllergies" value={formData.knownAllergies} onChange={handleChange} rows={2} placeholder="e.g., Peanuts, Asthma (Leave blank if none)" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-800 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer / Navigation */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : prevStep}
            className="flex items-center gap-2 px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-brown-800 text-cream-50 rounded-lg hover:bg-brown-900 transition font-medium"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> {isEditing ? 'Update Student' : 'Complete Onboarding'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}