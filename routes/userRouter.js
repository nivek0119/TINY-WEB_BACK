const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const User = require("../models/userModel");
const ShrotUrl = require("../models/shortUrl");
const shortid = require("shortid");

router.post("/register", async (req, res) => {
  try {
    let { email, password, passwordCheck, displayName } = req.body;


    if (!email || !password || !passwordCheck)
      return res.status(400).json({ msg: "Not all fields have been entered." });
    if (password.length < 5)
      return res
        .status(400)
        .json({ msg: "The password needs to be at least 5 characters long." });
    if (password !== passwordCheck)
      return res
        .status(400)
        .json({ msg: "Enter the same password twice for verification." });

    const existingUser = await User.findOne({ email: email });
    if (existingUser)
      return res
        .status(400)
        .json({ msg: "An account with this email already exists." });

    if (!displayName) displayName = email;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: passwordHash,
      displayName,
    });
    const savedUser = await newUser.save();
    res.json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Not all fields have been entered." });

    const user = await User.findOne({ email: email });
    if (!user)
      return res
        .status(400)
        .json({ msg: "No account with this email has been registered." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Password..😨 Calling FBI 🚨" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);


    const myURLS = await ShortUrl.find({ email: email });
    res.json({
      token,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        links: myURLS,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/deleteUser", auth, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user);
    res.json(deletedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tokenIsValid", async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);
    if (!user) return res.json(false);

    return res.json(true);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const myLinks = await ShrotUrl.find({ email: user.email });
    res.json({
      displayName: user.displayName,
      id: user._id,
      email: user.email,
      myLinks: myLinks,
    });
  } catch (error) {
    const m = err.message;
    res.status(500).json({ msg: m });
  }
});

router.post("/quick", async (req, res) => {
  try {
    const { full, email } = req.body;

    const existingFullUrl = await ShortUrl.findOne({ full: full });
    if (existingFullUrl)
      return res.status(400).json({ msg: "Oops ..!! Someone was Quick Then you 😱 ...FULL URL Already shortened" });

    const newQuick = new ShrotUrl({
      full: full,
      short: shortid.generate(),
      email: email,
    });
    const generatedQuick = await newQuick.save();

    res.json(generatedQuick);

  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.post("/custom", auth, async (req, res) => {
  try {
    const { full, short, email, title } = req.body;

    if (!full) return res.status(400).json({ msg: "Enter a valid full link" });

    if (!full) return res.status(400).json({ msg: "Enter a valid title" });

    const existingFullUrl = await ShortUrl.findOne({ full: full });
    if (existingFullUrl)
      return res.status(400).json({ msg: "Oops ..!! Someone was Quick Then you 😱 ...FULL URL Already shortened" });

    const existingShortUrl = await ShortUrl.findOne({ short: short });
    if (existingShortUrl)
      return res
        .status(400)
        .json({ msg: "Short URL already exists  😦, Try Another One 😶" });
    const newQuick = new ShortUrl({
      full: full,
      short: short,
      email: email,
      title: title,
    });
    const generatedQuick = await newQuick.save();
    res.json({ addedLink: newQuick, status: "added succesfully" });
    console.log(newQuick);

  } catch (err) {
    const m = err.message;
    res.status(500).json({ msg: m });
  }
});

router.post("/deleteCustom", auth, async (req, res) => {
  try {
    const email = req.body.email;
    const checkCustom = await ShortUrl.findOne({ short: req.body.short });

    if (checkCustom != null) {
      if (checkCustom.email == req.body.email) {
        const deleted = await ShortUrl.findByIdAndDelete(checkCustom._id);
        console.log(deleted);
        console.log("deleted");
        return res.status(200).json({ msg: "deleted" });
      } else {
        return res.status(400).json({ msg: "Dont Try to Delete Someone Else URL😒" });
      }
    } else {
      return res.status(400).json({ msg: "NOTHING FOUND NIGGA ..!! 🙄" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:shortUrl", async (req, res) => {
  try {

    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
    if (shortUrl == null) return res.json({ found: false });
    console.log(shortUrl);
    shortUrl.clicks++;
    shortUrl.save();
    res.json({ fullUrl: shortUrl.full, title: shortUrl.title, found: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }



});


module.exports = router;
