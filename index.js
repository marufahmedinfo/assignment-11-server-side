const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
// must be importance --- [require('dotenv').config()]
require('dotenv').config();

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://assignmen-11-language-exchange.netlify.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  // console.log('token inside the verifyToken', token);

  if (!token) {
    return res.status(401).send({ message: 'UnAuthorize Access' });
  }

  // verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'UnAuthorize Access' })
    }
    req.user = decoded;
    next();
  })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qihkr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const languageCollection = client.db('languageExchange').collection('language');
    const TutorsCollection = client.db('languageExchange').collection('tutors');
    const BookedTutorsCollection = client.db('languageExchange').collection('booked');


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '10h'
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true })
    });

    app.post('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true })
    })


    // tutors related APIS

    app.get('/language', async (req, res) => {
      const cursor = languageCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    });

    app.get('/tutors', async (req, res) => {
      const cursor = TutorsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    });

    app.post('/tutors', async (req, res) => {
      const NewTutors = req.body;
      const result = await TutorsCollection.insertOne(NewTutors);
      res.send(result)
    });


    app.put('/tutor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProducts = req.body;
      const updateProducts = {
        $set: {
          language: updatedProducts.language,
          name: updatedProducts.name,
          email: updatedProducts.email,
          image: updatedProducts.image,
          description: updatedProducts.description,
          price: updatedProducts.price,
          rating: updatedProducts.rating,
          details: updatedProducts.details,
          review: updatedProducts.review,
        }
      };
      const result = await TutorsCollection.updateOne(filter, updateProducts, options);
      res.send(result)
    });


    app.get('/tutors/:language', async (req, res) => {
      const language = req.params.language;
      const query = { language };
      const result = await TutorsCollection.find(query).toArray();
      res.send(result)
    });

    app.delete('/tutors/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TutorsCollection.deleteOne(query);
      res.send(result)
    });

    app.get('/mytutors/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };

      // console.log(req.cookies?.token)

      if (req.user.email !== req.params.email) {
        return res.status(403).message({ message: 'Forbidden Access' })
      }

      const result = await TutorsCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/tutor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TutorsCollection.findOne(query);
      res.send(result)
    });

    app.get('/bookTutor/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await BookedTutorsCollection.find(query).toArray();
      res.send(result)
    });

    app.get('/bookTutor', async (req, res) => {
      const cursor = BookedTutorsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    });


    app.post('/bookTutor', async (req, res) => {
      const bookInfo = req.body;
      const result = await BookedTutorsCollection.insertOne(bookInfo);
      res.send(result)
    });







    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






// MeSt2InKYBU0ABKW
// languageExchange

app.get('/', (req, res) => {
  res.send('Language Exchange server is running');
});

app.listen(port, () => {
  console.log(`Language Exchange server is waiting at: ${port}`)
});