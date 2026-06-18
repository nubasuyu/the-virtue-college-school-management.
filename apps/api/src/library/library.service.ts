import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  // Create a new book
  async createBook(
    tenantId: string,
    data: {
      title: string;
      author: string;
      isbn?: string;
      publisher?: string;
      publishedYear?: number;
      category?: string;
      description?: string;
      numberOfCopies?: number;
    }
  ) {
    const book = await this.prisma.book.create({
      data: {
        tenantId,
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        publisher: data.publisher,
        publishedYear: data.publishedYear,
        category: data.category,
        description: data.description,
      },
    });

    // Create book copies if specified
    if (data.numberOfCopies && data.numberOfCopies > 0) {
      const copies = [];
      for (let i = 1; i <= data.numberOfCopies; i++) {
        copies.push({
          tenantId,
          bookId: book.id,
          copyNumber: i,
          status: 'AVAILABLE',
        });
      }
      await this.prisma.bookCopy.createMany({
        data: copies,
      });
    }

    return this.getBookWithCopies(book.id);
  }

  // Get all books
  async getAllBooks(tenantId: string) {
    const books = await this.prisma.book.findMany({
      where: { tenantId },
      include: {
        copies: true,
      },
    });

    // Add availability info
    return books.map((book) => ({
      ...book,
      totalCopies: book.copies.length,
      availableCopies: book.copies.filter((c) => c.status === 'AVAILABLE').length,
    }));
  }

  // Get a single book with copies
  async getBookWithCopies(bookId: string) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: true,
      },
    });

    if (!book) throw new NotFoundException('Book not found');

    return {
      ...book,
      totalCopies: book.copies.length,
      availableCopies: book.copies.filter((c) => c.status === 'AVAILABLE').length,
    };
  }

  // Borrow a book
  async borrowBook(
    tenantId: string,
    bookCopyId: string,
    borrowerId: string,
    borrowerType: 'STUDENT' | 'TEACHER',
    dueDate: string
  ) {
    const bookCopy = await this.prisma.bookCopy.findUnique({
      where: { id: bookCopyId },
      include: { book: true },
    });

    if (!bookCopy) throw new NotFoundException('Book copy not found');
    if (bookCopy.status !== 'AVAILABLE') {
      throw new BadRequestException('This book copy is not available');
    }

    // Update book copy status
    await this.prisma.bookCopy.update({
      where: { id: bookCopyId },
      data: { status: 'BORROWED' },
    });

    // Create borrowing record
    return this.prisma.borrowing.create({
      data: {
        tenantId,
        bookCopyId,
        // Map the borrowerId to the correct field based on their type
        studentId: borrowerType === 'STUDENT' ? borrowerId : null,
        userId: borrowerType === 'TEACHER' ? borrowerId : null,
        borrowerType,
        dueDate: new Date(dueDate),
      },
      include: {
        bookCopy: {
          include: { book: true },
        },
        student: true,
        user: true,
      },
    });
  }

  // Return a book
  async returnBook(tenantId: string, borrowingId: string, fineAmount?: number) {
    const borrowing = await this.prisma.borrowing.findUnique({
      where: { id: borrowingId },
      include: { bookCopy: true },
    });

    if (!borrowing) throw new NotFoundException('Borrowing record not found');
    if (borrowing.returnedAt) {
      throw new BadRequestException('Book already returned');
    }

    // Update borrowing record
    const updatedBorrowing = await this.prisma.borrowing.update({
      where: { id: borrowingId },
      data: {
        returnedAt: new Date(),
        fineAmount: fineAmount || 0,
      },
      include: {
        bookCopy: {
          include: { book: true },
        },
      },
    });

    // Update book copy status back to AVAILABLE
    await this.prisma.bookCopy.update({
      where: { id: borrowing.bookCopyId },
      data: { status: 'AVAILABLE' },
    });

    return updatedBorrowing;
  }

  // Get active borrowings for a student
  async getStudentBorrowings(tenantId: string, studentId: string) {
    return this.prisma.borrowing.findMany({
      where: {
        tenantId,
        studentId: studentId,
        returnedAt: null,
      },
      include: {
        bookCopy: {
          include: { book: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  // Get all active borrowings (for admin)
  async getAllActiveBorrowings(tenantId: string) {
    return this.prisma.borrowing.findMany({
      where: {
        tenantId,
        returnedAt: null,
      },
      include: {
        bookCopy: {
          include: { book: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}