const express = require("express");
const PORT = 3000;
const mongoose = require("mongoose");
const app = express();
const jwt = require("jsonwebtoken");
const SECRET_KEY = "ScretSauce";
const router = express.Router();
const cors = require("cors");
app.use("/api/v1", router);
router.use(express.json());
app.use(cors());
router.use(cors());

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
//define Course user schema
const courseSchema = new mongoose.Schema({
  title: String,
  imgSrc: String,
  description: String,
});

const userSchema = new mongoose.Schema({
  username: String, //both are same, just the way to define differs
  password: { type: mongoose.Schema.Types.String },
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});

//define Mongoose model for Admin User
const Admin = new mongoose.model("Admin", adminSchema);
const Course = new mongoose.model("Course", courseSchema);
const User = new mongoose.model("User", userSchema);

/*Custom defined middlewares */
const authenticationOfJwtToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err, username) => {
      if (err) {
        return res.sendStatus(403);
      }
      console.log("Token authorized for:" + username.username);
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
    res.json({ Status: "Admin Created Succesfully", token: token }).send();
  }
});

//login for admin using post method.
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username, password });

  if (admin) {
    const token = jwt.sign({ username }, SECRET_KEY);
    res.status(200).send.json({ status: "Login successful", token: token });
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

/* Course CRUD-Start */

router.post("/courses/add", authenticationOfJwtToken, async (req, res) => {
  const { title, imgSrc, description } = req.body;

  const coursefound = await Course.findOne({ title });
  if (coursefound) {
    res.send("Course with same title already exists");
  } else {
    const course = new Course({ title, imgSrc, description });
    course.save();
    res.send("Course Added with course ID:" + course.id);
  }
});

router.get("/courses/:courseId", authenticationOfJwtToken, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (course) {
    res.json(course).send();
  } else {
    res.status(404).send();
  }
});

router.get("/courses", authenticationOfJwtToken, async (req, res) => {
  const course = await Course.find();
  if (course) {
    res.json(course).send();
  } else {
    res.status(404).send();
  }
});

router.put("/courses/:courseid", authenticationOfJwtToken, async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.courseid, req.body, {
    new: true,
  });
  if (course) {
    res.json({ message: "Course updated successfully" });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

router.delete(
  "/courses/:courseId",
  authenticationOfJwtToken,
  async (req, res) => {
    const del = await Course.findByIdAndDelete(req.params.courseId);
    console.log(del);
    res.send("Deleted successfully");
  }
);

/* Course CRUD -end */

/* User CRUD-Start */
//sign up metho the post method
router.post("/user/signup", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user) {
    res.status(403).send("User Already Signed up");
  } else {
    const token = jwt.sign({ username }, SECRET_KEY);
    let newUser = new User({ username, password });
    newUser.save();
    res.json({ Status: "User Created Succesfully", token: token }).send();
  }
});

//login for admin using post method.
router.post("/user/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });

  if (user) {
    const token = jwt.sign({ username }, SECRET_KEY);
    res.status(200).send({ status: "Login successful", token: token });
  } else {
    res.status(403).send("Invalid Login Credentials Provided");
  }
});

router.put("/user/changepass", authenticationOfJwtToken, async (req, res) => {
  const { username, oldPassword, password } = req.body;
  console.log(username, oldPassword, password);
  const oldUser = await User.findOne({ username });
  if (oldUser.password == oldPassword && oldUser.username != null) {
    const status = await oldUser.updateOne({ password: password });
    console.log(status); // to check update status
    res.send("Password Updated Succesfully:");
  } else {
    res.send("Please enter correct old password");
  }
});

router.post("/user/courses/add", authenticationOfJwtToken, async (req, res) => {
  const { username, title } = req.body;

  const coursefound = await Course.findOne({ title:title });
  if (coursefound) {
    const user = await User.findOne({username:username});
    if(user){
      console.log(user.id);
      console.log(coursefound.id);
      //todo - Add logic to return response if already course is purchased
      user.purchasedCourses.push(coursefound);
      user.save();
  }
  else{
    res.status(404).send("User not found");
  }
    res.send("Thank you for purchasing the course with ID:" + coursefound.id);
  } else {
    res.status(404).send("Course not found");
  }
});

router.delete(
  "/user/courses:courseId",
  authenticationOfJwtToken,
  async (req, res) => {
    const del = await Course.findByIdAndDelete(req.params.courseId);
    console.log(del);
    res.send("Deleted successfully");
  }
);

/* Course CRUD -end */
app.listen(PORT, () => {
  console.log("Backend server started for course selling website:");
});
