const express = require('express');
const mongodbModule = require('./public/javascripts/mongodb.js');
const multer = require('multer');
const path = require('path');
const { ObjectId } = require('mongodb');

const app = express();
const server = app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let newShoesAdded = [];

mongodbModule.connectToMongoDB()
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    server.close();
  });

process.on('SIGINT', () => {
  mongodbModule.closeMongoDBConnection();
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Page Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'practice.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, './public/pages/create.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, './public/pages/search.html'));
});

app.get('/update', (req, res) => {
  res.sendFile(path.join(__dirname, './public/pages/update.html'));
});

// --- Data APIs ---

// Reset in-memory list
app.get('/reload-shoes-added', (req, res) => {
  newShoesAdded = [];
  res.status(200).json({ message: `Length of list is [${newShoesAdded.length}].` });
});

// Add shoe from form
app.post('/api/shoe', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const newShoe = req.body;
  newShoe.image = {
    name: req.file.originalname,
    mimeType: req.file.mimetype,
    imageData: Buffer.from(req.file.buffer, 'binary')
  };

  // Validate input
  if (!newShoe.name || !newShoe.price || !newShoe.brand) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await mongodbModule.insertDocument(newShoe);
    newShoesAdded.push(newShoe);
    return res.status(200).json({ message: 'Shoe added successfully', shoe: result });
  } catch (error) {
    console.error('Error inserting shoe:', error);
    return res.status(500).json({ message: 'Error adding shoe' });
  }
});

// Persist shoes to DB
app.get('/api/shoes', async (req, res) => {
  addNewShoes(newShoesAdded, res);
});

// Add shoes from JSON file
app.post('/api/json-file', async (req, res) => {
  const jsonData = req.body.data;
  addNewShoes(jsonData, res);
});

// Load image by name
app.get('/images/:imageName', async (req, res) => {
  const imageName = req.params.imageName;
  await loadShoes(imageName, res);
});

// Search shoes
app.get('/searching', async (req, res) => {
  const searchQuery = req.query.q;
  const result = await mongodbModule.findDocumentByNameOrBrand(searchQuery);
  res.status(200).json(result);
});

// Get shoes by id or name
app.get('/api/shoes/all', async (req, res) => {
  const { id, name } = req.query;
  try {
    const results = await mongodbModule.findDocumentsByIdOrName({ id, name });
    res.status(200).json(results);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Update shoe by ID
app.put('/api/shoes/:id', upload.single('image'), async (req, res) => {
  try {
    const shoeId = req.params.id;
    const updatedData = req.body;

    if (req.file) {
      updatedData.image = {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        imageData: Buffer.from(req.file.buffer, 'binary')
      };
    }

    const result = await mongodbModule.updateShoeById(shoeId, updatedData);
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Shoe not found or not modified' });
    }

    res.status(200).json({ message: 'Shoe updated successfully' });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ message: 'Failed to update shoe' });
  }
});

// --- Helper Functions ---

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
    console.error('Failed to load image:', err);
    res.status(500).send('Error fetching image');
  }
}

async function addNewShoes(shoeList, res) {
  try {
    const result = await mongodbModule.insertDocument(shoeList);
    newShoesAdded = [];
    res.status(200).json({ message: 'Shoes uploaded to database successfully' });
  } catch (error) {
    console.error('Error uploading shoes:', error);
    res.status(500).json({ message: 'Error uploading shoes' });
  }
}
