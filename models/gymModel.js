const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const gymModelSchema = new mongoose.Schema(
  {
    memberName: {
      type: String,
      required: [true, "A member must have a name"], // validator
      trim: true,
      maxlength: [
        100,
        "A member name must have less or equal then 100 characters",
      ],
      minlength: [2, "A member name must have more or equal then 2 characters"],
    },
    memberID: {
      type: String,
      unique: true,
      required: [true, "A member must have an ID"], // validator
      trim: true,
      maxlength: [40, "A member ID must have less or equal then 40 characters"],
      minlength: [2, "A member ID must have more or equal then 2 characters"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: false,
  }
);

const Gym = mongoose.model("Gym", gymModelSchema);

module.exports = Gym;
