const express = require('express');
const multer = require('multer');
const {
  importContacts,
  downloadContacts,
  uploadContacts,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  deleteContacts
} = require('../controllers/contactController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/import', upload.single('file'), importContacts);
router.post('/download', downloadContacts);
router.post('/upload', uploadContacts);
router.get('/', getContacts);
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);
router.delete('/', deleteContacts);

module.exports = router;