import { useEffect, useState } from 'react';
import api from '../lib/axios';

export default function Library() {
  const [activeTab, setActiveTab] = useState<'books' | 'borrowed'>('books');
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [availableCopies, setAvailableCopies] = useState<any[]>([]);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', numberOfCopies: 1 });
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
      await api.post('/library/book', bookForm);
      setMessage('✅ Book added successfully!');
      setBookForm({ title: '', author: '', isbn: '', numberOfCopies: 1 }); // ✅ FIXED
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
      dueDate.setDate(dueDate.getDate() + 14);
      
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

  const handleEditBook = (book: any) => {
    setEditingBook({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      numberOfCopies: book.totalCopies,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/library/book/${editingBook.id}`, editingBook);
      setMessage('✅ Book updated successfully!');
      setIsEditModalOpen(false);
      setEditingBook(null);
      fetchData();
    } catch (error) {
      setMessage('❌ Failed to update book.');
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

      {activeTab === 'books' && (
        <div className="space-y-6">
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
                    <th className="px-6 py-3 text-right">Action</th>
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
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditBook(book)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No books in the catalog yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'borrowed' && (
        <div className="space-y-6">
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

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Book</h3>
            <form onSubmit={handleUpdateBook} className="space-y-4">
              <input
                required
                placeholder="Book Title"
                value={editingBook?.title || ''}
                onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                required
                placeholder="Author"
                value={editingBook?.author || ''}
                onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                placeholder="ISBN (Optional)"
                value={editingBook?.isbn || ''}
                onChange={(e) => setEditingBook({...editingBook, isbn: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                required
                type="number"
                min="1"
                placeholder="Total Copies"
                value={editingBook?.numberOfCopies || 1}
                onChange={(e) => setEditingBook({...editingBook, numberOfCopies: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition font-semibold"
                >
                  Update Book
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}