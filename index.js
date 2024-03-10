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
    const wishlistCollection = client.db("MyShop").collection("wishlists");
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

    //get all users
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    //get role by api data from database just fetch like localhost:5000/users/${seller}

    app.get("/users/:role", async (req, res) => {
      const role = req.params.role;
      const query = { role: role };
      const result = await userCollection.find(query).toArray();

      res.send(result);
    });

    //status by query
    app.get("/sellers/pending/:status", async (req, res) => {
      const status = req.params.status;
      const query = { status: status };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    //? approve and deactivate seller

    app.put("/seller/status/:id", async (req, res) => {
      const id = req.params.id;
      const action = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: action.status,
        },
      };

      const result = await userCollection.updateOne(query, update);
      res.send(result);
    });

    //================================================================

    //! product post and get api ===========================

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    //get only discount product

    // app.get("/product/:discount", async (req, res) => {
    //   const discount = req.params.discount;
    //   const query = { discount: discount };
    //   console.log(query);
    //   const result = await productsCollection.find(query).toArray();
    //   res.send(result);
    // });

    //get all products

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    //get single product

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    //details page product
    app.get("/products/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    //get product by email

    app.get("/products/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    //product delete seller dashboard

    app.delete("/product/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    //update product all data
    app.patch("/product/update/:id", async (req, res) => {
      const product = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          product_name: product.product_name,
          brand: product.brand,
          category: product.category,
          stock: product.stock,
          price: product.price,
          discount: product.discount,
          short_description: product.short_description,
          description: product.description,
        },
      };

      const result = await productsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //update product discount

    app.patch("/product/discount/update/:id", async (req, res) => {
      const product = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          discount: product.discount,
        },
      };

      const result = await productsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //================================================================

    //!=================================add to cart =======================

    app.post("/carts", async (req, res) => {
      const product = req.body;
      const query = { productId: product.productId, email: product.email };
      const existingProduct = await cartCollection.findOne(query);
      if (existingProduct) {
        return res.send({ message: "Product already added", insertedId: null });
      }
      const result = await cartCollection.insertOne(product);
      res.send(result);
    });

    app.get("/carts", async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    });

    app.get("/carts/items", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/carts/items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const cart = req.body;
      const updateDoc = {
        $set: {
          count: cart.count,
        },
      };
      const result = await cartCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //============================================================================//
    //!=================================add to wishlist =======================

    app.post("/wishlists", async (req, res) => {
      const product = req.body;
      const query = { productId: product.productId, email: product.email };
      const existingProduct = await wishlistCollection.findOne(query);
      if (existingProduct) {
        return res.send({ message: "Product already added", insertedId: null });
      }
      const result = await wishlistCollection.insertOne(product);
      res.send(result);
    });

    app.get("/wishlists", async (req, res) => {
      const result = await wishlistCollection.find().toArray();
      res.send(result);
    });

    app.get("/wishlists/items", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/wishlists/items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
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

    app.put("/categories/update/:id", async (req, res) => {
      const id = req.params.id;
      const categories = req.body;
      const query = { _id: new ObjectId(id) };

      const update = {
        $set: {
          category: categories.category,
        },
      };
      const result = await categoryCollection.updateOne(query, update);
      res.send(result);
    });

    app.get("/category/single/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoryCollection.findOne(query);
      res.send(result);
    });

    //============================================================================//

    //!Banner ==========

    app.post("/banners", async (req, res) => {
      const category = req.body;
      const result = await bannersCollection.insertOne(category);
      res.send(result);
    });

    app.get("/banners", async (req, res) => {
      const result = await bannersCollection.find().toArray();
      res.send(result);
    });

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
