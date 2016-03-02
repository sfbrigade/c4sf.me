var bcrypt = require('bcrypt-nodejs')
var crypto = require('crypto')
var mongoose = require('mongoose')

var urlSchema = new mongoose.Schema({
  slug: { type: String, unique: true },
  url: String,
  description: String,
  author: String,
  private: Boolean
}, { timestamps: true })

var Url = mongoose.model('Url', urlSchema)

module.exports = Url
