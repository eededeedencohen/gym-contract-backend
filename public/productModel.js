const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'], // validator
      trim: true,
      maxlength: [
        100,
        'A product name must have less or equal then 50 characters',
      ],
      minlength: [
        2,
        'A product name must have more or equal then 2 characters',
      ],
    },
    hasUiqueBarcode: {
      type: Boolean,
      default: false,
    },
    barcode: {
      type: String,
      unique: true,
      required: [true, 'A product must have a barcode'], // validator
      trim: true,
      maxlength: [40, 'A barcode must have less or equal then 40 characters'],
      minlength: [2, 'A barcode must have more or equal then 2 characters'],
    },
    brand: {
      type: String,
      //required: [true, 'A product must have a brand'], // validator
    },
    weight: {
      type: Number,
      // required: [true, 'A product must have a weight'], // validator
      default: 0,
    },
    unitWeight: {
      type: String,
      required: [true, 'A product must have a unit weight'], // validator
      enum: {
        values: ['g', 'kg', 'ml', 'l', 'u', 't'],
        message: 'unitWeight is either: g, kg, ml, l, or u',
      },
    },
    generalName: {
      type: String,
      required: [true, 'A product must have a general name'], // validator
    },
    category: {
      type: String,
      required: [true, 'A product must have a category'], // validator
    },
    subcategory: {
      type: String,
      required: [true, 'A product must have a subcategory'], // validator
    },
    // Other fields can be added here as needed
  },
  {
    toJSON: { virtuals: true }, // this will show up in the output
    toObject: { virtuals: true }, // this will show up in the output
    strict: false, // Allows for handling of fields not explicitly defined in the schema
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;