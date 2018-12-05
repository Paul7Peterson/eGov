const express = require('express');
const router = express.Router();

const entity = require('../controllers/entity.controller');

// Entities
router.get('/entities', entity.getEntitiesList);
router.post('/entities', entity.createEntity);
router.get('/entities/:id', entity.getEntityById);
router.put('/entities/:id', entity.editEntityById);
router.delete('/entities/:id', entity.deleteEntity);

module.exports = router;