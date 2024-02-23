const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, Db, ObjectId } = require("mongodb");

app.use(
  cors({
    credentials: true,
    origin: [
      "https://myshop-606ef.firebaseapp.com",
      "https://myshop-606ef.web.app",
      "http://localhost:5173",
    ],
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yrssrk8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //==================================Collection======================================//

    //? All collection
    const userCollection = client.db("MyShop").collection("users");
    const productsCollection = client.db("MyShop").collection("products");
    const cartCollection = client.db("MyShop").collection("carts");
    const compareCollection = client.db("MyShop").collection("compares");
    const favoriteCollection = client.db("MyShop").collection("favorites");
    const bannersCollection = client.db("MyShop").collection("banners");
    const categoryCollection = client.db("MyShop").collection("categories");

    //!jwt related api

    //!middleware
    const verifyToken = (req, res, next) => {
      console.log("inside the bearer token", req.headers);
      if (!req.token.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const userRole = await userCollection.findOne({ email: user.email });
      if (!userRole) {
        return res.status(401).send({ message: "Invalid Credentials" });
      }
      const { role } = userRole;
      const payload = { user, role };

      console.log(payload);

      const token = jwt.sign(payload, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "7d",
      });
      res.send({ token });
    });

    //============================================================================//

    //!userOperations

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    //!userOperations\\

    //============================================================================//

    //! product post & get operation

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    //============================================================================//

    //!  categories all operations
    app.post("/categories", async (req, res) => {
      const category = req.body;
      const result = await categoryCollection.insertOne(category);
      res.send(result);
    });

    app.get("/categories", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    app.delete("/categories/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });

    // app.patch("/categories/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const update = {
    //     $set:{

    //     }
    //   }
    //   const result = await categoryCollection.deleteOne(query);
    //   res.send(result);
    // });

    //============================================================================//

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/health", (req, res) => {
  res.send("E-commerce website running");
});

app.all("*", (req, res, next) => {
  const error = new Error(`the requested url is invalid : [${req.url}]`);
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 404).json({
    message: error.message,
  });
});

app.listen(port, () => {
  console.log(`E-commerce website running on port,${port}`);
});
