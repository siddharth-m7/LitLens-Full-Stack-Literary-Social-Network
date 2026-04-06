const User = require('../models/User');

exports.findById = (id) => User.findById(id);

exports.findByIdExcludePassword = (id) => User.findById(id).select('-password');

exports.findByIdExcludePasswordEmail = (id) => User.findById(id).select('-password -email');

exports.findByEmail = (email) => User.findOne({ email });

exports.create = (data) => User.create(data);

exports.findByIdAndUpdate = (id, update) => User.findByIdAndUpdate(id, update);

exports.findByIdAndDelete = (id, session) =>
  User.findByIdAndDelete(id, session ? { session } : {});

exports.findAll = () => User.find({}).select('-password').sort({ createdAt: -1 });

exports.countDocuments = (filter) => User.countDocuments(filter);

exports.aggregate = (pipeline) => User.aggregate(pipeline);
