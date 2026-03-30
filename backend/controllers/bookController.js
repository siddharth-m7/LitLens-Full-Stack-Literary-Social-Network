const bookService = require('../services/bookService');
const catchAsync = require('../utils/catchAsync');

exports.getAllBooks = catchAsync(async (req, res) => {
  const result = await bookService.getAllBooks(req.query);
  res.json(result);
});

exports.getBookById = catchAsync(async (req, res) => {
  const book = await bookService.getBookById(req.params.id);
  res.json(book);
});

exports.createBook = catchAsync(async (req, res) => {
  const book = await bookService.createBook({ ...req.body, createdBy: req.user.id });
  res.status(201).json(book);
});

exports.updateBook = catchAsync(async (req, res) => {
  const book = await bookService.updateBook(req.params.id, req.body);
  res.json(book);
});

exports.deleteBook = catchAsync(async (req, res) => {
  await bookService.deleteBook(req.params.id);
  res.json({ message: 'Book deleted' });
});
