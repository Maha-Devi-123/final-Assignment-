const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "twitterClone.db");
let db;
const app = express();
app.use(express.json());

//db and server installation
const dbAndServerInstallation = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running...");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};
dbAndServerInstallation();

const authenticateUser = async (request, response, next) => {
  const { jwtToken } = request.headers["authorization"];
  let userToken;
  if (jwtToken !== undefined) {
    userToken = jwtToken.split(" ")[1];
  }
  if (userToken !== undefined) {
    const verifyToken = jwt.verify(userToken, "SECRETKEY", (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
};

//register api
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  console.log(username);

  const isValidUser = `SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(isValidUser);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const shortLengthPassword = password.length < 6;
    if (shortLengthPassword) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const payloads = { username: username };
      const jwtToken = jwt.sign(payloads, "SECRECTKEY");
      const hashedPassword = bcrypt.hash(password, 10);
      const addUserQuery = `INSERT INTO user (name,username,password,gender) 
        VALUES("${name}","${username}","${hashedPassword}","${gender}");`;
      await db.run(addUserQuery);
      response.send("User created successfully");
    }
  }
});

//login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const isValidUser = `SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(isValidUser);

  if (dbUser !== undefined) {
    const checkPassword = await bcrypt.compare(password, dbUser.password);
    console.log(checkPassword);
    if (checkPassword === true) {
      const payloads = { username: username };
      const jwtToken = jwt.sign(payloads, "SECRECTKEY");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});
