const Book = require('../models/Book');

// Get all books (public) — supports ?search=&genre=&minRating=&sort=&page=&limit=
exports.getAllBooks = async (req, res) => {
  try {
    const { search, genre, minRating, sort, page, limit } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { author: regex }, { description: regex }];
    }

    if (genre && genre !== 'All') {
      filter.genre = genre;
    }

    if (minRating) {
      filter.averageRating = { $gte: Number(minRating), $ne: null };
    }

    const ratingSort = sort === 'highest_rated' || sort === 'lowest_rated';

    // Exclude books with no reviews when sorting by rating
    if (ratingSort) {
      filter.averageRating = { ...filter.averageRating, $ne: null };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest_rated: { averageRating: -1 },
      lowest_rated: { averageRating: 1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const [books, totalCount] = await Promise.all([
      Book.find(filter).sort(sortBy).skip(skip).limit(limitNum).populate('createdBy', 'name email'),
      Book.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      data: books,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name' } // nested populate
      });

    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: Create book
exports.createBook = async (req, res) => {
  const { title, author, description, genre, coverImage } = req.body;

  try {
    const newBook = new Book({
      title,
      author,
      description,
      genre: genre || '',
      coverImage: coverImage || '',
      createdBy: req.user.id
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Admin: Update book
exports.updateBook = async (req, res) => {
  const { title, author, description, genre, coverImage } = req.body;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (description !== undefined) book.description = description;
    if (genre !== undefined) book.genre = genre;
    if (coverImage !== undefined) book.coverImage = coverImage;

    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Admin: Delete book
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await book.deleteOne();
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};