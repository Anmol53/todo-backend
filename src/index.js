const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const db = require("./db");

const app = express();

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);
app.use(
  session({
    secret: "cvszcoki8rk8667o44r378",
    cookie: {
      maxAge: 1 * 60 * 60 * 1000, // 1 hour session
    },
  })
);

const { User, Todo } = db;
const SALT = 8;

const isNullOrUndefined = (inp) => inp === null || inp === undefined;

const AuthMW = async (req, res, next) => {
  if (
    isNullOrUndefined(req.session) ||
    isNullOrUndefined(req.session.user_id)
  ) {
    res.status(401).send({
      status: "Unauthorized",
      message: "Not logged in",
    });
  } else {
    next();
  }
};

app.post("/signup", async (req, res) => {
  const { user_name, password } = req.body;
  if (
    isNullOrUndefined(user_name) ||
    user_name.length < 1 ||
    isNullOrUndefined(password) ||
    password.length < 1
  ) {
    res.status(400).send({
      status: "Bad Request",
      message: `User name and password are required fields`,
    });
    return;
  }
  const existingUser = await User.findOne({ user_name });
  if (existingUser) {
    res.status(400).send({
      status: "Bad Request",
      message: `User name ${req.body.user_name} already exist!\nPlease choose another.`,
    });
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, SALT);
    const newUser = new User({
      ...req.body,
      password: hashedPassword,
    });
    req.session.user_id = newUser._id;
    newUser.save();
    res.status(201).send({
      status: "Created",
      message: `User ${req.body.user_name} created!`,
    });
    a.send();
  }
});

app.post("/login", async (req, res) => {
  const { user_name, password } = req.body;
  if (isNullOrUndefined(user_name) || isNullOrUndefined(password)) {
    res.status(400).send({
      status: "Bad Request",
      message: `User name and password are required fields`,
    });
    return;
  }
  const existingUser = await User.findOne({ user_name });
  if (existingUser) {
    if (bcrypt.compareSync(req.body.password, existingUser.password)) {
      req.session.user_id = existingUser._id;
      res.status(200).send({
        status: "OK",
        message: `${req.body.user_name} Logged in!`,
      });
    } else {
      res.status(401).send({
        status: "Unauthorized",
        message: `Incorrect Password`,
      });
    }
  } else {
    res.status(401).send({
      status: "Unauthorized",
      message: `User name ${req.body.user_name} not found`,
    });
  }
});

app.get("/logout", async (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.status(200).send({
        status: "OK",
        message: "Logged out",
      });
    });
  } else {
    res.status(400).send({
      status: "Bad Request",
      message: "No User Logged in",
    });
  }
});

app.get("/userDetails", AuthMW, async (req, res) => {
  const existingUser = await User.findById(req.session.user_id);
  res.status(200).send({
    status: "OK",
    message: `Fetched already Logged user!`,
    user: {
      user_name: existingUser.user_name,
      first_name: existingUser.first_name,
      last_name: existingUser.last_name,
      user_mail: existingUser.user_mail,
    },
  });
});
// Create
app.post("/todo", AuthMW, async (req, res) => {
  const newTodo = new Todo({
    task: req.body.task,
    creationTime: new Date(),
    isDone: false,
    user_id: req.session.user_id,
  });
  try {
    await newTodo.save();
    res.status(200).send({
      status: "ok",
      message: "Task saved",
      task: newTodo,
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

// Update
app.put("/todo/:todoId", AuthMW, async (req, res) => {
  const todoId = req.params.todoId;
  try {
    const todo = await Todo.findOne({
      _id: todoId,
      user_id: req.session.user_id,
    });
    if (isNullOrUndefined(todo)) {
      res.status(404).send({
        status: "Not Found",
        message: `Todo Not Found`,
      });
      return;
    }
    if (req.body.task) {
      todo.task = req.body.task;
    }
    if (req.body.isDone != null) {
      todo.isDone = req.body.isDone;
    }
    await todo.save();
    res.status(200).send({
      status: "ok",
      message: `Successfully Updated`,
      task: todo,
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: `The server has encountered an error. ${e}`,
    });
  }
});

// Delete
app.delete("/todo/:todoId", AuthMW, async (req, res) => {
  const todoId = req.params.todoId;
  try {
    await Todo.deleteOne({
      _id: todoId,
      user_id: req.session.user_id,
    });

    res.status(200).send({
      status: "ok",
      message: `Successfully Deleted`,
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

// Sending all the todos as an Array
app.get("/todo", AuthMW, async (req, res) => {
  try {
    const todos = await Todo.find({ user_id: req.session.user_id });
    res.status(200).send({
      status: "ok",
      message: `${todos.length} todos fetched`,
      todos,
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

app.listen(9999, () => console.log("Server is running at port #9999"));
