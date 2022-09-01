const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

const initializeDbAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB ERROR:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const checkedPassword = password.length < 5 ? true : false;
  const userCheckQuery = `select * from user where username='${username}';`;
  const userResponse = await db.get(userCheckQuery);
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  if (userResponse === undefined) {
    if (checkedPassword === true) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const postQuery = `insert into user(username,name,password,gender,location)
        values ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      const dbResponse = await db.run(postQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userCheckQuery = `select * from user where username='${username}';`;
  const userResponse = await db.get(userCheckQuery);

  if (userResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userResponse.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userCheckQuery = `select * from user where username='${username}';`;
  const userResponse = await db.get(userCheckQuery);
  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    userResponse.password
  );
  const checkedPassword = newPassword.length < 5 ? true : false;
  if (isPasswordMatched === true) {
    if (checkedPassword) {
      const newPassword = await bcrypt.hash(request.body.newPassword, 10);
      const putQuery = `update user set password='${newPassword}' where username='${username}';`;
      const update = await db.run(putQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
