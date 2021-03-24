const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const e = require("express");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const port = 80;

// EXPRESS CONFIGURATION
app.use("/static", express.static("static")); // For serving static files
app.use(express.urlencoded()); // For getting data from html form

// PUG CONFIGURATION
app.set("view engine", "pug"); // Set the template engine as pug
app.set("views", path.join(__dirname, "views"));

// END-POINTS
let params = {
  loginerrmsg: "",
  signuperrmsg: "",
  signupsuccessmsg: "",
};
let dashData = {
  user: "",
  successmsg: "",
  errmsg: "",
};
// HOME PAGE
app.get("/", (req, res) => {
  res.status(200).render("index.pug", params);
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.status(200).render("login.pug", params);
});

app.post("/authentication", (req, res) => {
  let email = req.body.user_email;
  let password = req.body.user_password;

  // Checking login form inputed data
  if (email && password) {
    // authentication of user then access to deshboard
    params.loginerrmsg = "";
    fs.readFile(`userdata/${email}/${email}.json`, "utf-8", (err, data) => {
      if (err) {
        params.loginerrmsg = "Invalid User!!";
        res.status(404).render("login.pug", params);
      } else {
        params.loginerrmsg = "";
        let serverData = JSON.parse(data);
        if (
          serverData.user_email === email &&
          serverData.user_password === password
        ) {
          res.cookie("UID", email, { maxAge: 3600000 });
          res.status(200).redirect("/deshboard");
        } else {
          params.loginerrmsg =
            "Unautherized User! Please Login With Currect Data.";
          res.status(404).render("login.pug", params);
        }
      }
    });
  } else {
    params.loginerrmsg = "Error To Login!! Please Try Again With Valid Data.";
    res.status(403).render("login.pug", params);
  }
});

// SIGNUP PAGE
app.get("/signup", (req, res) => {
  if (
    params.signupsuccessmsg === "Your Account Has Been Created Successfully"
  ) {
    res.status(200).render("login.pug", params);
  } else {
    res.status(200).render("signup.pug", params);
  }
});

app.post("/signingup", (req, res) => {
  let name = req.body.user_name;
  let email = req.body.user_email;
  let password = req.body.user_password;
  let confirmPass = req.body.user_conf_password;

  if (name && email && password && confirmPass) {
    let userData = JSON.stringify(req.body);
    let dir = path.join(__dirname, `userdata/${email}`);

    // Creating directory To Store Users Data
    fs.mkdirSync(dir);

    fs.writeFileSync(`userdata/${email}/${email}.json`, userData);

    params.signupsuccessmsg = "Your Account Has Been Created Successfully";
    params.signuperrmsg = "";

    res.render("login.pug", params);
  } else {
    params.signupsuccessmsg = "";
    params.signuperrmsg = "Please Fill The All Details!";
    res.render("signup.pug", params);
  }
});

// DESHBOARD
app.get("/deshboard", (req, res) => {
  let uid = req.cookies.UID;
  if (uid) {
    dashData.user = uid;
    res.status(200).render("deshboard/index.pug", dashData);
  } else {
    params.loginerrmsg = "Error To Login!! Please Try Again With Valid Data.";
    res.status(403).render("login.pug", params);
  }
});

app.post("/createfolder", (req, res) => {
  let uid = req.cookies.UID;
  let FolderName = req.body.folder_name;
  dashData.user = uid;
  let dir = path.join(__dirname, `userdata/${uid}/${FolderName}`);

  // checking if folder already exists
  if (!fs.existsSync(dir)) {
    // Creating Folder
    fs.mkdirSync(dir);
    dashData.successmsg = "Folder Is Created";
    dashData.errmsg = "";
    res.status(200).render("deshboard/index.pug", dashData);
  } else {
    dashData.successmsg = "";
    dashData.errmsg = "Folder already exists! Try Different Name";
    res.status(403).render("deshboard/index.pug", dashData);
  }
});

// Display all folders of perticular user
app.get("/allfiles", (req, res) => {
  let uid = req.cookies.UID;
  dashData.user = uid;

  let fileData = [];
  // Path for in which dir to serch files
  let dir = path.join(__dirname, `userdata/${uid}/`);

  let filenames = fs.readdirSync(dir);

  filenames.forEach((file) => {
    fileData.push(file);
  });

  res.status(200).render("deshboard/allfiles.pug", { dashData, fileData });
});

// STARTING SERVER
app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});
