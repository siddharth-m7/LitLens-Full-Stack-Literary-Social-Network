const bookService = require('../services/bookService');

exports.getAllBooks = async (req, res) => {
  try {
    const result = await bookService.getAllBooks(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    res.json(book);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const book = await bookService.createBook({ ...req.body, createdBy: req.user.id });
    res.status(201).json(book);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const book = await bookService.updateBook(req.params.id, req.body);
    res.json(book);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    await bookService.deleteBook(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
