const express = require('express');
const mongodbModule = require('./public/javascripts/mongodb.js');
const multer = require('multer');
const path = require('path');

const app = express();


var newShoesAdded = [];

const server = app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongodbModule.connectToMongoDB()
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    server.close()
  });

process.on('SIGINT', () => {
  mongodbModule.closeMongoDBConnection()
});

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'practice.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, './public/pages/create.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, './public/pages/search.html'));
});

app.get('/reload-shoes-added', (req, res) => {
  newShoesAdded = [];
  res.status(200).json({ message: `Length of list is [${newShoesAdded.length}].` });
})

app.post('/api/shoe', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const newShoe = req.body;
  newShoe.image = {
    name: req.file.originalname,
    mimeType: req.file.mimetype,
    imageData: new Buffer.from(req.file.buffer, 'binary')
  }

  // const imageUrl = req.file ? `uploads/${req.file.filename}` : "";
  // console.log('Image URL:' + imageUrl);
  // newShoe.image = imageUrl;

  console.log(newShoe);
  newShoesAdded.push(newShoe);
  return res.status(200).json({ message: 'Shoe added to list successfully' });
});

app.get('/api/shoes', async (req, res) => {
  addNewShoes(newShoesAdded, res);
});

app.post('/api/json-file', async (req, res) => {
  const jsonData = req.body.data; //Chỗ này phải khai báo app.use(express.json()); mới chạy được
  addNewShoes(jsonData, res);
})

app.get('/images/:imageName', async (req, res) => {
  const imageName = req.params.imageName;
  await loadShoes(imageName, res);
  
});

app.get('/searching', async (req, res) => {
  const searchQuery = req.query.q;
  console.log('Search queryyy:', searchQuery);
  const result = await mongodbModule.findDocumentByNameOrBrand(searchQuery);
  console.log('Search result:', result);
  res.status(200).json(result);
});


async function loadShoes(imageName, res) {
    try {
      const imageDocument = await mongodbModule.findDocumentByName(imageName);
      if (imageDocument && imageDocument.imageData) {
        const imageData = imageDocument.imageData.buffer;
        const mimeType = imageDocument.mimeType;
  
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': imageData.length
        });
        res.end(Buffer.from(imageData, 'binary'));
      } else {
        res.status(404).send('Image not found');
      }
    } catch (err) {
      console.error("Failed to load image:", err);
      res.status(500).send('Error fetching image');
    }
}

async function addNewShoes(newShoesAdded, res) {
    try {
        const result = await mongodbModule.insertDocument(newShoesAdded);
        newShoesAdded = [];
        // console.log('Image uploaded successfully. ID:', result.insertedId);
        // res.send(`Image uploaded successfully. Image ID: ${result.insertedId}. <a href="/images/${result.insertedId}">View Image</a>`);
        res.status(200).json({ message: 'Shoe uploaded to database successfully' });
    } catch (error) {
        console.error('Error uploading shoe:', error);
        res.status(500).json({ message: 'Error uploading shoe' });
    }
}