const express = require('express');
const mongodbModule = require('./public/javascripts/mongodb.js');
const multer = require('multer');
const path = require('path');
const queryString = require('querystring');

const app = express();
const server = app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let newShoesAdded = [];
let newImagesAdded = [];
let updateList = [];
let updateImageShoes = [];

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
  res.sendFile(path.join(__dirname, './public/pages/home.html'));
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

app.get('/update-detail', (req, res) => {
  res.sendFile(path.join(__dirname, './public/pages/update-form.html'));
});

app.get('/delete', (req, res) => {
  res.sendFile(path.join(__dirname, './public/pages/delete.html'));
});

app.get('/read/for/update', async (req, res) => {
  const id = req.query.id;
  console.log('ID for update:', id);
  try {
    editShoe = await mongodbModule.findDocumentsByIdOrName(  { id: id, name: '' } );
    const queryParams = queryString.stringify(editShoe[0]);
    res.redirect(`/update-detail?${queryParams}`);
  } catch (error) {
    console.error('Error fetching shoe for update:', error);
    res.status(500).json({ message: 'Error fetching shoe for update' });
  }
});

// --- Data APIs ---

app.get('/load-all-shoes', async (req, res) => {
  const condition = req.query.condition;
  try {
    if(condition) {
      const shoes = await mongodbModule.findAllDocuments(condition);
      res.status(200).json(shoes);
      return;
    }
    const shoes = await mongodbModule.findAllDocuments();
    res.status(200).json(shoes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all shoes' });
  }
});

// Reset in-memory list
app.get('/reload-shoes-added', (req, res) => {
  newShoesAdded = [];
  res.status(200).json({ message: `Length of list is [${newShoesAdded.length}].` });
});

app.get('/highest-id', async (req, res) => {
  try {
    const highestId = await mongodbModule.getHighestID();
    res.status(200).json({ highestId });
  } catch (error) {
    console.error('Error fetching highest ID:', error);
    res.status(500).json({ message: 'Error fetching highest ID' });
  }
});

// Add shoe from form
app.post('/api/shoe', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const newShoe = req.body;
  newShoe.image = req.file.originalname;

  const newImageShoe = {}
  newImageShoe.image = {
    name: req.file.originalname,
    mimeType: req.file.mimetype,
    imageData: Buffer.from(req.file.buffer, 'binary')
  };
  newImageShoe.id = newShoe.id;

  try {
    newShoesAdded.push(newShoe);
    newImagesAdded.push(newImageShoe);
    return res.status(200).json({ message: 'Shoe added successfully to list!' });
  } catch (error) {
    console.error('Error inserting shoe:', error);
    return res.status(500).json({ message: 'Error adding shoe' });
  }
});

// Persist shoes to DB
app.get('/api/shoes', async (req, res) => {
  addNewShoes(newShoesAdded, newImagesAdded, res);
});

// Add shoes from JSON file
app.post('/api/json-file', async (req, res) => {
  const jsonData = req.body.data;
  addNewShoes(jsonData, null, res);
});

app.get('/searching', async (req, res) => {
  const nameOrBrand = req.query.q;
  const { priceMin, priceMax, brand, size } = req.query;
  const searchQuery = {
    nameOrBrand: nameOrBrand != "" ? nameOrBrand : null,
    priceMin: priceMin || null,
    priceMax: priceMax || null,
    brand: brand || null,
    size: size || null
  };
  console.log('Search query:', searchQuery);
  result = await mongodbModule.findDocument(searchQuery);
  res.status(200).json(result);
 
});

// Get shoes by id or name
app.get('/get-shoes', async (req, res) => {
  const id =  req.query.id ? req.query.id : '';
  const name = req.query.name ? req.query.name : '';
  try {
    const results = await mongodbModule.findDocumentsByIdOrName({ id, name });
    res.status(200).json(results);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

app.delete('/delete-item/:id', async (req, res) => {
  const id = req.params.id;
  console.log('ID for delete:', id);
  try {
    const result = await mongodbModule.deleteShoeByID(id);
    res.status(200).json({ message: 'Shoe deleted successfully' });
  }
  catch (error) {
    res.status(500).json({ message: 'Error deleting shoe' });
  }
})

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

app.post('/update-add', upload.single('image'), async (req, res) => {
  if (!req.file) {
    // return res.status(400).json({ message: 'No file uploaded' });
  }
  const updatedShoe = req.body;
  const updateImageShoe = {}
  console.log('Updated shoe:', updatedShoe);
  if(req.file) {
    updatedShoe.image = req.file.originalname;

    updateImageShoe.image = {
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      imageData: Buffer.from(req.file.buffer, 'binary')
    };
    updateImageShoe.id = updatedShoe.id;
  }

  try {
    updateList.push(updatedShoe);
    updateImageShoes.push(updateImageShoe);
    return res.status(200).json({ message: 'Shoe added successfully to update list!' });
  } catch (error) {
    console.error('Error inserting shoe:', error);
    return res.status(500).json({ message: 'Error adding shoe to update list.' });
  }
});

app.put('/update-one', upload.single('image'), async (req, res) => {
  const editShoe = req.body;
  if (!req.file) {
    updateOne(editShoe, null, res);
  }
  const updateImageShoe = {}
  if(req.file) {
    editShoe.image = req.file.originalname;

    updateImageShoe.image = {
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      imageData: Buffer.from(req.file.buffer, 'binary')
    };
    updateImageShoe.id = editShoe.id;
    updateOne(editShoe, updateImageShoe, res);
  }
})

app.put('/update-many', async (req, res) => {
  updateShoes(updateList, res);
});



app.put('/update-price-many', async (req, res) => {
  const { price, stock, brand } = req.body;
  updateMany(price, brand, stock, res);

});

app.get('/images/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const image = await mongodbModule.findImageByImageName(name);
    if (image) {
      const imageData = image.imageData.buffer;
      const mimeType = image.mimeType;
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': imageData.length
      });
      res.end(Buffer.from(image.imageData.buffer, 'binary'));
    } else {
      res.status(404).send('Image not found');
    }
  } catch (err) {
    console.error('Failed to load image:', err);
    res.status(500).send('Error fetching image');
  }
})

async function addNewShoes(shoeList, imgList, res) {
  try {
    await mongodbModule.insertDocument(shoeList, imgList);
    newShoesAdded = [];
    res.status(200).json({ message: 'Shoes uploaded to database successfully' });
  } catch (error) {
    console.error('Error uploading shoes:', error);
    res.status(500).json({ message: 'Error uploading shoes' });
  }
}

async function updateShoes(shoeList, res) {
  try {
    await mongodbModule.updateByID(shoeList, updateImageShoes);
    newShoesAdded = [];
    res.status(200).json({ message: 'Shoes updated in database successfully' });
  } catch (error) {
    console.error('Error updating shoes:', error);
    res.status(500).json({ message: 'Error updating shoes' });
  }
}

async function updateOne(shoe, image,  res){
  try {
    await mongodbModule.updateByID(shoe, image);
    res.status(200).json({ message: 'Shoes updated in database successfully' });
  } catch (error) {
    console.error('Error updating shoes:', error);
    res.status(500).json({ message: 'Error updating shoes' });
  }
};

async function updateMany(price, brand, stock, res) {
  try {
    await mongodbModule.updateManyBySearchResult(price, brand, stock);
    res.status(200).json({ message: 'Shoes updated in database successfully' });
  } catch (error) {
    console.error('Error updating shoes:', error);
    res.status(500).json({ message: 'Error updating shoes' });
  }
}
