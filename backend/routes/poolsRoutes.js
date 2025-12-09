import express from 'express';
import * as controller from '../controllers/poolsController.js';

const router = express.Router();

router.get('/', controller.getAllPools);
router.get('/user', controller.getUserPools);
router.get('/:id', controller.getPoolById);

// body parsing middleware can be applied app-wide; included here for safety
router.post('/', express.json(), controller.createPool);
router.post('/:id/join', express.json(), controller.joinPool);

export default router;
