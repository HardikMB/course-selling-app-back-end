const express = require("express");
const PORT = 3000;
const mongoose = require("mongoose");
const app = express();
const jwt = require("jsonwebtoken");
const SECRET_KEY = "ScretSauce";
const router = express.Router();

app.use("/api/v1", router);
router.use(express.json());

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Methods", "GET");
  next();
});

router.get("/health", (req, res) => {
  res.status(200).send("Ok");
});

//connect to Mongo DB
mongoose.connect("mongodb://127.0.0.1:27017/courses");

//define Admin user schema
const adminSchema = new mongoose.Schema({
  username: String, //both are same, just the way to define differs
  password: { type: mongoose.Schema.Types.String },
});

//define Mongoose model for Admin User
const Admin = new mongoose.model("Admin", adminSchema);

/*Custom defined middlewares */
const authenticationOfJwtToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token =authHeader.split(' ')[1]
    jwt.verify(token, SECRET_KEY, (err,username) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = username;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

/* Controller Methods*/
//sign up metho the post method
router.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });

  if (admin) {
    res.status(403).send("Admin Already Signed up");
  } else {
    const token = jwt.sign({ username }, SECRET_KEY);
    let newAdmin = new Admin({ username, password });
    newAdmin.save();
    res.status(201).send("Admin Created Succesfully:" + token);
  }
});

//login for admin using post method.
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username, password });

  if (admin) {
    const token = jwt.sign({ username });
    res.status(200).send("Login successful" + token);
  } else {
    res.status(403).send("Invalid Login Credentials Provided");
  }
});

router.put("/admin/changepass", authenticationOfJwtToken, async (req, res) => {
  const { username, oldPassword, password } = req.body;
  console.log(username, oldPassword, password);
  const oldAdmin = await Admin.findOne({ username });
  if (oldAdmin.password == oldPassword && oldAdmin.username != null) {
    const status = await oldAdmin.updateOne({ password: password });
    console.log(status); // to check update status
    res.send("Password Updated Succesfully:");
  } else {
    res.send("Please enter correct old password");
  }
});

app.listen(PORT, () => {
  console.log("Backend server started for course selling website:");
});
