const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      ref: "users",
    },

    content: {
      type: String,
      required: true,
    },

    replies: [
      {
        type: String,
        ref: "comments",
      },
    ],

    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const commentModel = mongoose.model("comments", commentSchema);

module.exports = commentModel;
