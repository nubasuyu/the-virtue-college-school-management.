import { useEffect, useState } from 'react';
import api from '../lib/axios';

export default function Library() {
  const [activeTab, setActiveTab] = useState<'books' | 'borrowed'>('books');
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  
    const [availableCopies, setAvailableCopies] = useState<any[]>([]);
  // Form state for adding a book
   const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', numberOfCopies: 1 });
  
  // Form state for borrowing
  const [borrowForm, setBorrowForm] = useState({ bookId: '', studentId: '' });
  const [message, setMessage] = useState('');

      const fetchData = async () => {
    try {
      const [booksRes, studentsRes, recordsRes] = await Promise.all([
        api.get('/library/book'),
        api.get('/student'),
        api.get('/library/borrowings')
      ]);
      setBooks(booksRes.data);
      setStudents(studentsRes.data);
      setRecords(recordsRes.data);
      
      // Extract all available copies from the books
      const allCopies = booksRes.data.flatMap((book: any) => 
        book.copies?.filter((c: any) => c.status === 'AVAILABLE').map((c: any) => ({
          ...c,
          bookTitle: book.title,
          bookAuthor: book.author
        })) || []
      );
      setAvailableCopies(allCopies);
    } catch (error) {
      console.error('Error fetching library data:', error);
    }
  };
  useEffect(() => { fetchData(); }, []);

    const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/library/book', bookForm);  // 👈 Changed from /library/books
      setMessage('✅ Book added successfully!');
      setBookForm({ title: '', author: '', isbn: '', totalCopies: 1 });
      fetchData();
    } catch (error) {
      setMessage('❌ Failed to add book.');
    }
    setTimeout(() => setMessage(''), 2000);
  };
  
    const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks from now
      
      await api.post('/library/borrow', {
        bookCopyId: borrowForm.bookId,
        borrowerId: borrowForm.studentId,
        borrowerType: 'STUDENT',
        dueDate: dueDate.toISOString(),
      });
      setMessage('✅ Book borrowed successfully!');
      setBorrowForm({ bookId: '', studentId: '' });
      fetchData();
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.message || 'Failed to borrow.'}`);
    }
    setTimeout(() => setMessage(''), 2000);
  };

    const handleReturn = async (recordId: string) => {
    try {
      await api.patch(`/library/return/${recordId}`, { fineAmount: 0 });
      setMessage('✅ Book returned successfully!');
      fetchData();
    } catch (error) {
      setMessage('❌ Failed to return book.');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Library Management</h2>

      {message && (
        <div className={`px-4 py-2 rounded text-sm font-medium ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'books' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📚 Book Catalog
        </button>
        <button
          onClick={() => setActiveTab('borrowed')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'borrowed' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🔄 Borrowed Books ({records.length})
        </button>
      </div>

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          {/* Add Book Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Book</h3>
            <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input required placeholder="Book Title" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md" />
              <input required placeholder="Author" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md" />
              <input placeholder="ISBN (Optional)" value={bookForm.isbn} onChange={e => setBookForm({...bookForm, isbn: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md" />
              <input required type="number" min="1" placeholder="Total Copies" value={bookForm.numberOfCopies} onChange={e => setBookForm({...bookForm, numberOfCopies: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-md" />
              <div className="md:col-span-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition font-semibold">
                  Add Book to Catalog
                </button>
              </div>
            </form>
          </div>

          {/* Book List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700">Current Catalog</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Author</th>
                    <th className="px-6 py-3">ISBN</th>
                    <th className="px-6 py-3 text-center">Available / Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {books.map(book => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{book.title}</td>
                      <td className="px-6 py-4 text-gray-600">{book.author}</td>
                      <td className="px-6 py-4 text-gray-500">{book.isbn || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${book.availableCopies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {book.availableCopies} / {book.totalCopies}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No books in the catalog yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Borrowed Tab */}
      {activeTab === 'borrowed' && (
        <div className="space-y-6">
          {/* Borrow Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Issue a Book to a Student</h3>
            <form onSubmit={handleBorrow} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select required value={borrowForm.studentId} onChange={e => setBorrowForm({...borrowForm, studentId: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>)}
              </select>
                            <select required value={borrowForm.bookId} onChange={e => setBorrowForm({...borrowForm, bookId: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select Available Copy</option>
                {availableCopies.map(copy => (
                  <option key={copy.id} value={copy.id}>
                    {copy.bookTitle} - Copy #{copy.copyNumber}
                  </option>
                ))}
              </select>
              <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition font-semibold">
                Issue Book
              </button>
            </form>
          </div>

          {/* Active Borrow Records */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700">Currently Borrowed</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Book</th>
                    <th className="px-6 py-3">Borrowed Date</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                                <tbody className="divide-y divide-gray-100">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {record.student?.firstName} {record.student?.lastName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.bookCopy?.book?.title} (Copy #{record.bookCopy?.copyNumber})
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(record.borrowedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleReturn(record.id)} className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-600 transition">
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No books are currently borrowed.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}