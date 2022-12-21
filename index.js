const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const MongoClient = require("mongodb").MongoClient;
const history = require("connect-history-api-fallback");
const app = express();
const port = 3000;
const url =
  "mongodb+srv://adilali:adil@vue-db.kvxpzco.mongodb.net/?retryWrites=true&w=majority";
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};
// app.use('/images', express.static(path.join(__dirname, '../images')));
app.use(cors());
app.use(bodyParser.json());
// app.get("/api/products", async (req, res) => {
//   MongoClient.connect(url,{
//     useNewUrlParser:true,
//     useUnifiedTopology:true
//   },(err,client)=>{
//     if(err){
//       console.log(err);
//       res.status(500).send(err);
//     }else {
//       const collection = client.db("vue-db").collection("products");
//       collection.find({}).toArray((err, document)=>{
//         if(err){
//           console.log(err)
//           res.status(500).send(err)
//         }else{
//           res.send(document)
//         }
//         client.close()
//       })
//     }
//   })
// });
app.get("/api/products", async (req, res) => {
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db("vue-db");
  const collection = db.collection("products");
  const products = await collection.find({}).toArray();
  if (products) {
    res.status(200).json(products);
    console.log("products");
  } else {
    res.status(404).json({ message: "Product not found" });
    console.log("not found");
  }
});

app.get("/api/products/:productsId", async (req, res) => {
  const productsId = req.params.productsId;
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db("vue-db");
  const collection = db.collection("products");
  const product = await collection.findOne({ id: productsId });
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json({ message: `Product not found ${productsId}` });
  }
  client.close();
});

app.get("/api/users/:userId/cart", async (req, res) => {
  const { userId } = req.params;
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db("vue-db");
  const user = await db.collection("users").findOne({ id: userId });
  if (!user)
    return res.status(404).json({ message: `User not found ${userId}` });
  const collection = db.collection("products");
  const products = await collection.find({}).toArray();
  const cartItemsIds = user.cartItems;
  const cartItems = cartItemsIds.map((id) =>
    products.find((product) => product.id === id)
  );
  //  const cartItems = await collection.find({id: {$in: cartItemsIds}}).toArray(); ((This is also good approach)))
  res.status(200).json(cartItems);
  client.close();
});
//Add items to the cart
app.post("/api/users/:userId/cart", async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db("vue-db");
  await db
    .collection("users")
    .updateOne({ id: userId }, { $addToSet: { cartItems: productId } });
  const user = await db.collection("users").findOne({ id: userId });
  const products = db.collection("products");
  const cartItemsIds = user.cartItems;
  const cartItems = await products
    .find({ id: { $in: cartItemsIds } })
    .toArray();
  res.status(200).json(cartItems);
  client.close();
});
app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
  const { userId, productId } = req.params;
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db("vue-db");
  await db
    .collection("users")
    .updateOne({ id: userId }, { $pull: { cartItems: productId } });
  const user = await db.collection("users").findOne({ id: userId });
  const products = await db.collection("products").find({}).toArray();
  const cartItemsIds = user.cartItems;
  const cartItems = cartItemsIds.map((id) =>
    products.find((product) => product.id === id)
  );
  res.status(200).json(cartItems);
  client.close();
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
