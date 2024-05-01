const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const adminSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: { type: "String", required: true },
    username: { type: "String", unique: true, required: true },
    password: { type: "String", required: true },
  },
  { timestamps: true }
);

const Admin = mongoose.model("admin", adminSchema);

module.exports = Admin;
