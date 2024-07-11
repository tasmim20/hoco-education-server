require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 30000,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // const db = client.db("clothingStore");
    // const productCollection = db.collection("products");
    const db = client.db("hocoEducation");
    const collection = db.collection("users");
    const coursesCollection = db.collection("courses");
    const instructorCollection = db.collection("instructor");
    const booksCollection = db.collection("books");
    const reviewsCollection = db.collection("reviews");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, image, userName, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exist!!!",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({
        name,
        image,
        userName,
        email,
        password: hashedPassword,
        role: "student",
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully!",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          name: user.name,
          image: user.image,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "User successfully logged in!",
        accessToken: token,
      });
    });

    //course post api
    app.post("/api/v1/courses", async (req, res) => {
      const courses = req.body;
      const result = await coursesCollection.insertOne(courses);
      if (result.insertedId) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });
    app.post("/api/v1/reviews", async (req, res) => {
      const reviews = req.body;
      const result = await reviewsCollection.insertOne(reviews);
      if (result.insertedId) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    //instructors post api
    app.post("/api/v1/instructors", async (req, res) => {
      const instructors = req.body;
      const result = await instructorCollection.insertOne(instructors);
      if (result.insertedId) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    //get reviews api
    app.get("/api/v1/reviews", async (req, res) => {
      try {
        const result = await reviewsCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });
    //get courses api
    app.get("/api/v1/courses", async (req, res) => {
      try {
        const result = await coursesCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });
    //get courses according to id
    app.get("/api/v1/courses/:courseId", async (req, res) => {
      const courseId = req.params.courseId;

      // Validate bookId as a valid ObjectId
      if (!ObjectId.isValid(courseId)) {
        return res.status(400).send({ error: "Invalid bookId" });
      }

      try {
        const query = { _id: new ObjectId(courseId) };
        const book = await coursesCollection.findOne(query);

        if (!book) {
          return res.status(404).send({ error: "Book not found" });
        }

        res.status(200).send(book);
      } catch (error) {
        console.error("Error fetching book:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });
    //get instructors api
    app.get("/api/v1/instructors", async (req, res) => {
      try {
        const result = await instructorCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    // UPDATE an instructor by ID
    app.put("/instructors/:id", async (req, res) => {
      const { id } = req.params; // Assuming id is passed as a parameter

      try {
        const updatedInstructor = await Instructor.findByIdAndUpdate(
          id,
          req.body,
          { new: true }
        );

        if (!updatedInstructor) {
          return res.status(404).json({ error: "Instructor not found" });
        }

        res.json(updatedInstructor);
      } catch (error) {
        console.error("Error updating instructor:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // DELETE API for deleting an instructor by ID

    app.delete("/api/v1/instructors/:id", async (req, res) => {
      const instructorId = req.params.id;
      console.log(
        `Received request to delete instructor with id: ${instructorId}`
      );

      try {
        const result = await instructorCollection.deleteOne({
          _id: new ObjectId(instructorId),
        });

        if (result.deletedCount === 0) {
          console.log(`Instructor with id ${instructorId} not found`);
          return res
            .status(404)
            .send({ success: false, message: "Instructor not found" });
        }

        console.log(`Instructor with id ${instructorId} deleted successfully`);
        res.send({ success: true, message: "Instructor deleted successfully" });
      } catch (error) {
        console.error("Error deleting instructor:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });
    //get books api
    app.get("/api/v1/books", async (req, res) => {
      try {
        const result = await booksCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    //get books according to id
    app.get("/api/v1/books/:bookId", async (req, res) => {
      const bookId = req.params.bookId;

      // Validate bookId as a valid ObjectId
      if (!ObjectId.isValid(bookId)) {
        return res.status(400).send({ error: "Invalid bookId" });
      }

      try {
        const query = { _id: new ObjectId(bookId) };
        const book = await booksCollection.findOne(query);

        if (!book) {
          return res.status(404).send({ error: "Book not found" });
        }

        res.status(200).send(book);
      } catch (error) {
        console.error("Error fetching book:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Education server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
