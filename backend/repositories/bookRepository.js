const Book = require('../models/Book');

exports.findWithFilter = ({ filter, sortBy, skip, limitNum }) =>
  Book.find(filter).sort(sortBy).skip(skip).limit(limitNum).populate('createdBy', 'name email');

exports.countDocuments = (filter) => Book.countDocuments(filter);

exports.findById = (id) =>
  Book.findById(id)
    .populate('createdBy', 'name')
    .populate({ path: 'reviews', populate: { path: 'user', select: 'name' } });

exports.findByIdRaw = (id) => Book.findById(id);

exports.create = (data) => Book.create(data);

exports.findByIdAndUpdate = (id, update) => Book.findByIdAndUpdate(id, update);

exports.bulkWrite = (ops) => Book.bulkWrite(ops);

exports.aggregate = (pipeline) => Book.aggregate(pipeline);
