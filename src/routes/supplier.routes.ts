import { Router } from 'express';
import { supplierController } from '../controllers';
import { validate, authenticate, sanitizeBody } from '../middlewares';
import {
  createSupplierSchema,
  updateSupplierSchema,
  querySupplierSchema,
} from '../validators';

const router = Router();

router.use(authenticate);

router.get('/active/list', supplierController.getActive);

router.post(
  '/',
  sanitizeBody,
  validate(createSupplierSchema),
  supplierController.create
);

router.get('/', validate(querySupplierSchema, 'query'), supplierController.getAll);

router.get('/:id', supplierController.getById);

router.put(
  '/:id',
  sanitizeBody,
  validate(updateSupplierSchema),
  supplierController.update
);

router.delete('/:id', supplierController.delete);

export default router;