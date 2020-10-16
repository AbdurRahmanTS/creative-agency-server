const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.fxa3v.mongodb.net:27017,cluster0-shard-00-01.fxa3v.mongodb.net:27017,cluster0-shard-00-02.fxa3v.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-11d4rj-shard-0&authSource=admin&retryWrites=true&w=majority`;

const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

const port = 5000;


app.get('/', (req, res) => {
  res.send('Hello World!')
})


MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client) {
  const serviceCollection = client.db(`${process.env.DB_NAME}`).collection("services");
  const reviewCollection = client.db(`${process.env.DB_NAME}`).collection("reviews");
  const adminCollection = client.db(`${process.env.DB_NAME}`).collection("admins");
  const orderCollection = client.db(`${process.env.DB_NAME}`).collection("orders");

  app.post('/addService', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    const img = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };

    serviceCollection.insertOne({ title, description, price, img })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/services', (req, res) => {
    serviceCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });


  app.post('/addReview', (req, res) => {
    const img = req.body.img;
    const name = req.body.name;
    const title = req.body.title;
    const description = req.body.description;
    reviewCollection.insertOne({ name, title, description, img })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })


  app.get('/feedbacks', (req, res) => {
    reviewCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });


  app.post('/addAdmin', (req, res) => {
    const admin = req.body.email;
    adminCollection.insertOne({ admin })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ admin: email })
      .toArray((err, admin) => {
        res.send(admin.length > 0);
      })
  })


  app.post('/servicesList', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ admin: email })
      .toArray((err, admin) => {
        const filter = {};
        if (admin.length === 0) {
          filter.email = email;
        }
        orderCollection.find(filter)
          .toArray((err, documents) => {
            res.send(documents);
          })
      })
  })


  app.post('/addOrder', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const img = req.body.img;
    const status = "Pending";
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    const projectFile = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };

    orderCollection.insertOne({ name, email, title, description, status, price, img, projectFile })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })


  app.patch('/updateOrder/:id', (req, res) => {
    const statu = req.body.status;
    orderCollection.updateOne({ _id: ObjectId(req.params.id) },
      {
        $set: { status: statu }
      })
      .then(result => {
        res.send(result);
      })
  })

});


app.listen(process.env.PORT || port)