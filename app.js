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
  fileCreatedsmsg: "",
  fileDeletedsmsg: "",
  folderCreatedsmsg: "",
  CreatingErrmsg: "",
  DeletingErrmsg: "",
  createdFiles: "",
  countCreatedFiles: "",
};
// GLOBAL FUNCTIONS
function getCountCreatedFiles(UID) {
  let uid = UID;

  let files = [];
  // Path for in which dir to serch files
  let dir = path.join(__dirname, `userdata/${uid}/`);
  let filenames = fs.readdirSync(dir);

  filenames.forEach((file) => {
    files.push(file);
  });
  return files;
}
// END

// HOME PAGE
app.get("/", (req, res) => {
  res.status(200).render("index.pug", params);
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.status(200).render("login.pug", params);
});

// LOGIN AUTHENTICATION
app.post("/authentication", (req, res) => {
  let email = req.body.user_email;
  let password = req.body.user_password;

  // Checking login form inputed data
  if (email && password) {
    // authentication of user then access to deshboard
    params.loginerrmsg = "";
    fs.readFile(`userdata/${email}/${email}.json`, "utf-8", (err, data) => {
      if (err) {
        params.loginerrmsg =
          "Unautherized User! Please Register Your Self First.";
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
            "Invalid Id Or Password! Please Login With Currect Data.";
          res.status(404).render("login.pug", params);
        }
      }
    });
  } else {
    params.loginerrmsg = "Error To Login!! Please Try Again With Valid Data.";
    res.status(403).render("login.pug", params);
  }
});

app.get("/authentication", (req, res) => {
  res.redirect("/login");
});
// END

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
    if (password !== confirmPass) {
      params.signupsuccessmsg = "";
      params.signuperrmsg =
        "Confirm Password Doesn't Matched! Enter Common Password";
      res.render("signup.pug", params);
    } else {
      let userData = JSON.stringify(req.body);
      let dir = path.join(__dirname, `userdata/${email}`);

      // Checking Account Already Exist
      if (fs.existsSync(dir) === true) {
        params.signupsuccessmsg = "";
        params.signuperrmsg =
          "This Email Is Already Exists! Please Try Diffrent Email.";
        res.render("signup.pug", params);
      } else {
        // Creating directory To Store Users Data
        fs.mkdirSync(dir);
        fs.writeFileSync(`userdata/${email}/${email}.json`, userData);
        params.signupsuccessmsg =
          "Your Account Has Been Created Successfully.Now You Can Login.";
        params.signuperrmsg = "";
        res.render("login.pug", params);
      }
    }
  } else {
    params.signupsuccessmsg = "";
    params.signuperrmsg = "Please Fill The All Details!";
    res.render("signup.pug", params);
  }
});
// END

// DESHBOARD
app.get("/deshboard", (req, res) => {
  let uid = req.cookies.UID;
  if (uid) {
    dashData.user = uid;
    let createdFiles = getCountCreatedFiles(uid);
    dashData.createdFiles = createdFiles;
    dashData.countCreatedFiles = createdFiles.length;
    res.status(200).render("deshboard/index.pug", dashData);
  } else {
    params.loginerrmsg = "Error To Login!! Please Try Again With Valid Data.";
    res.status(403).render("login.pug", params);
  }
});
// END

// CREATEING FILES
app.post("/createfile", (req, res) => {
  let uid = req.cookies.UID;
  let FileName = req.body.file_name;
  let FileContent = req.body.file_content;
  dashData.user = uid;
  let dir = path.join(__dirname, `userdata/${uid}/${FileName}.txt`);

  // checking if file already exists
  if (!fs.existsSync(dir)) {
    // Creating File
    fs.appendFileSync(dir, FileContent);
    dashData.fileCreatedsmsg = "File Is Created";
    dashData.CreatingErrmsg = "";
    res.status(200).render("deshboard/index.pug", dashData);
  } else {
    dashData.fileCreatedsmsg = "";
    dashData.CreatingErrmsg = "File already exists! Try Different Name";
    res.status(403).render("deshboard/index.pug", dashData);
  }
});
// END

// CREATEING FOLDERS
app.post("/createfolder", (req, res) => {
  let uid = req.cookies.UID;
  let FolderName = req.body.folder_name;
  dashData.user = uid;
  let dir = path.join(__dirname, `userdata/${uid}/${FolderName}`);

  // checking if folder already exists
  if (!fs.existsSync(dir)) {
    // Creating Folder
    fs.mkdirSync(dir);
    dashData.folderCreatedsmsg = "Folder Is Created";
    dashData.CreatingErrmsg = "";
    res.status(200).render("deshboard/index.pug", dashData);
  } else {
    dashData.folderCreatedsmsg = "";
    dashData.CreatingErrmsg = "Folder already exists! Try Different Name";
    res.status(403).render("deshboard/index.pug", dashData);
  }
});
// END

// DELETING FILES
app.post("/deletefile", (req, res) => {
  let uid = req.cookies.UID;
  let SelectedFile = req.body.selected_file;

  dashData.user = uid;
  let dir = path.join(__dirname, `userdata/${uid}/${SelectedFile}`);

  // checking if folder already exists
  if (!fs.existsSync(dir)) {
    dashData.fileDeletedsmsg = "";
    dashData.DeletingErrmsg = "File Not Found!";
    res.status(403).render("deshboard/index.pug", dashData);
  } else {
    if (SelectedFile.indexOf(".") > 0) {
      // Delete File
      fs.unlinkSync(dir);
      dashData.fileDeletedsmsg = "File Is Deleted";
      dashData.DeletingErrmsg = "";
      res.status(200).render("deshboard/index.pug", dashData);
    } else {
      // Delete Folder
      fs.rmdir(dir, { recursive: true }, (err) => {
        if (err) {
          console.log(err);
        }
        dashData.fileDeletedsmsg = "Folder Is Deleted";
        dashData.DeletingErrmsg = "";
        res.status(200).render("deshboard/index.pug", dashData);
      });
    }
  }
});
// END

// Display all folders of perticular user
app.get("/allfiles", (req, res) => {
  let uid = req.cookies.UID;
  dashData.user = uid;

  let fileData = [];
  // Path for in which dir to serch files
  let dir = path.join(__dirname, `userdata/${uid}/`);

  //  checking file is exists
  fs.readdir(dir, (err, files) => {
    if (err) {
      res.redirect("/deshboard");
    } else {
      let filenames = fs.readdirSync(dir);

      filenames.forEach((file) => {
        fileData.push(file);
      });

      res.status(200).render("deshboard/allfiles.pug", { dashData, fileData });
    }
  });
});

// LOGOUT
app.get("/logout", (req, res) => {
  res.clearCookie("UID");
  res.redirect("/login");
});

// STARTING SERVER
app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});
