const Chat = require("../models/chatModel");
const User = require("../models/userModel");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  try {
    var isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.userId } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.userId, userId],
      };

      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// //@description     Fetch all chats for a user
// //@route           GET /api/chat/
// //@access          Protected
const fetchChats = async (req, res) => {
  try {
    const results = await Chat.find({
      users: { $elemMatch: { $eq: req.userId } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .exec();

    await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).send(results);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// //@description     Create New Group Chat
// //@route           POST /api/chat/group
// //@access          Protected
const createGroupChat = async (req, res) => {
  try {
    if (!req.body.users || !req.body.name) {
      return res.status(400).send({ message: "Please Fill all the fields" });
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
      return res
        .status(400)
        .send("More than 2 users are required to form a group chat");
    }

    users.push(req.userId);

    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.userId,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json({ status: 200, data: fullGroupChat });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// // @desc    Rename Group
// // @route   PUT /api/chat/rename
// // @access  Protected
const renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: chatName,
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(404);
      throw new Error("Chat Not Found");
    } else {
      res.json(updatedChat);
    }
  } catch (error) {
    // Xử lý lỗi
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// // @desc    Remove user from Group
// // @route   PUT /api/chat/groupremove
// // @access  Protected
const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    // Kiểm tra nếu người gửi yêu cầu là quản trị viên

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      res.status(404);
      throw new Error("Chat Not Found");
    } else {
      res.json(removed);
    }
  } catch (error) {
    // Xử lý lỗi
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// // @desc    Add user to Group / Leave
// // @route   PUT /api/chat/groupadd
// // @access  Protected
const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    // Kiểm tra nếu người gửi yêu cầu là quản trị viên
    const added = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      res.status(404);
      throw new Error("Chat Not Found");
    } else {
      res.json(added);
    }
  } catch (error) {
    // Xử lý lỗi
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
