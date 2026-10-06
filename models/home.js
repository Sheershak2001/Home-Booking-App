const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  homeName: { type: String, required: true },
  price: { type: Number, required: true },
  homeAddress: { type: String, required: true },
  rating: { type: Number, required: true },
  photo: String,
  photoData: Buffer,
  photoContentType: String,
  description: String,
});

homeSchema.virtual('photoUrl').get(function () {
  if (this.photoData) {
    return `/homes/${this._id}/photo`;
  }

  if (!this.photo) {
    return '';
  }

  if (/^https?:\/\//i.test(this.photo) || this.photo.startsWith('/')) {
    return this.photo;
  }

  const normalizedPath = this.photo.replace(/\\/g, '/').replace(/\/+/g, '/');
  const uploadsIndex = normalizedPath.lastIndexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return normalizedPath.slice(uploadsIndex);
  }

  return `/${normalizedPath}`;
});

// homeSchema.pre('findOneAndDelete', async function (next) {
//   console.log('deleted from favourites in database');
//   const homeId = this.getQuery()['_id'];
//   await favourites.deleteMany({ homeId: homeId });
// });
module.exports = mongoose.model('Home', homeSchema);
