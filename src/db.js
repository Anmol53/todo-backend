const mongoose = require("mongoose");

const mongoURI =
  "mongodb+srv://anmol53:anmol53@todocluster.4mru3.mongodb.net/todo?retryWrites=true&w=majority";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connection established with mongodb server 🤗");
  })
  .catch((err) => {
    console.log("Error while connection 😑", err);
  });

const todoSchema = new mongoose.Schema({
  task: String,
  creationTime: Date,
  isDone: Boolean,
  user_id: mongoose.Schema.Types.ObjectId,
});

const userSchema = new mongoose.Schema({
  user_name: String,
  first_name: String,
  last_name: String,
  user_mail: String,
  password: String,
});

const Todo = mongoose.model("Todo", todoSchema);
const User = mongoose.model("User", userSchema);

module.exports.Todo = Todo;
module.exports.User = User;
