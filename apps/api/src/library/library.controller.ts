import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // Create a book
  @Post('book')
  async createBook(@Request() req: any, @Body() body: any) {
    return this.libraryService.createBook(req.user.tenantId, body);
  }

  // Get all books
  @Get('book')
  async getAllBooks(@Request() req: any) {
    return this.libraryService.getAllBooks(req.user.tenantId);
  }

  // Get a specific book
  @Get('book/:bookId')
  async getBook(@Request() req: any, @Param('bookId') bookId: string) {
    return this.libraryService.getBookWithCopies(bookId);
  }

  // Borrow a book
  @Post('borrow')
  async borrowBook(@Request() req: any, @Body() body: any) {
    return this.libraryService.borrowBook(
      req.user.tenantId,
      body.bookCopyId,
      body.borrowerId,
      body.borrowerType,
      body.dueDate
    );
  }

  // Return a book
  @Patch('return/:borrowingId')
  async returnBook(
    @Request() req: any,
    @Param('borrowingId') borrowingId: string,
    @Body() body: { fineAmount?: number }
  ) {
    return this.libraryService.returnBook(
      req.user.tenantId,
      borrowingId,
      body.fineAmount
    );
  }

  // Get student's active borrowings
  @Get('student/:studentId/borrowings')
  async getStudentBorrowings(
    @Request() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.libraryService.getStudentBorrowings(
      req.user.tenantId,
      studentId
    );
  }

  // Get all active borrowings
  @Get('borrowings')
  async getAllActiveBorrowings(@Request() req: any) {
    return this.libraryService.getAllActiveBorrowings(req.user.tenantId);
  }
}