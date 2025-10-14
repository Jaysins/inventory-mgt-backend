# Node.js REST API Architecture Guide
## The Complete Blueprint for Building Scalable Backend Systems

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Layer-by-Layer Guide](#layer-by-layer-guide)
4. [Code Flow & Data Movement](#code-flow--data-movement)
5. [Adding New Features](#adding-new-features)
6. [Common Patterns](#common-patterns)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### The Golden Rule
**Data flows in ONE direction only:**
```
HTTP Request → Routes → Middlewares → Controllers → Services → Repositories → Database
                                                                      ↓
HTTP Response ← Controllers ← Services ← Repositories ← Database
```

### Core Principles

1. **Separation of Concerns**: Each layer has ONE job
2. **Dependency Injection**: Pass dependencies as parameters
3. **No Circular Dependencies**: Never import "upward" in the chain
4. **Pure Functions**: Utils and helpers have no side effects
5. **Single Responsibility**: Each file does one thing well

---

## Project Structure

```
src/
├── config/              # Configuration files (database, redis, auth, etc.)
│   ├── database.ts      # MongoDB connection setup
│   ├── redis.ts         # Redis client singleton
│   ├── auth.ts          # JWT and bcrypt settings
│   ├── exchangeRate.ts  # External API config
│   ├── app.ts           # Express app config
│   └── index.ts         # Export all configs
│
├── models/              # Database schemas (Mongoose models)
│   ├── user.model.ts
│   ├── conversion.model.ts
│   ├── auditLog.model.ts
│   └── index.ts         # Export all models
│
├── repositories/        # Database query layer
│   ├── user.repository.ts
│   ├── conversion.repository.ts
│   ├── auditLog.repository.ts
│   └── index.ts
│
├── services/            # Business logic layer
│   ├── auth.service.ts
│   ├── conversion.service.ts
│   ├── exchangeRate.service.ts
│   ├── dashboard.service.ts
│   ├── audit.service.ts
│   └── index.ts
│
├── controllers/         # HTTP request handlers
│   ├── auth.controller.ts
│   ├── conversion.controller.ts
│   ├── dashboard.controller.ts
│   └── auditLog.controller.ts
│
├── routes/              # API endpoint definitions
│   ├── auth.routes.ts
│   ├── conversion.routes.ts
│   ├── dashboard.routes.ts
│   ├── auditLog.routes.ts
│   └── index.ts         # Combine all routes
│
├── middlewares/         # Request interceptors
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   ├── rateLimit.middleware.ts
│   ├── requestLogger.middleware.ts
│   ├── sanitize.middleware.ts
│   ├── cors.middleware.ts
│   └── index.ts
│
├── validators/          # Joi validation schemas
│   ├── auth.validator.ts
│   ├── conversion.validator.ts
│   ├── dashboard.validator.ts
│   └── index.ts
│
├── utils/               # Framework utilities (infrastructure)
│   ├── logger.ts        # Winston logger setup
│   ├── response.ts      # Response formatters
│   ├── errors.ts        # Custom error classes
│   ├── constants.ts     # App-wide constants
│   └── pagination.ts    # Pagination helpers
│
├── helpers/             # Business domain helpers
│   ├── jwt.ts           # Token generation/verification
│   ├── encryption.ts    # Password hashing
│   ├── date.ts          # Date formatting
│   └── validation.ts    # Input validators
│
├── types/               # TypeScript interfaces (if needed)
│   └── index.ts
│
├── app.ts               # Express app setup
└── server.ts            # Server startup
```

---

## Layer-by-Layer Guide

### 1. Models Layer (`models/`)

**Purpose**: Define database schemas and data structure

**Rules**:
- ✅ Only define schema/structure
- ✅ Add validation at schema level
- ✅ Create indexes for performance
- ❌ NO business logic
- ❌ NO database queries

**Template**:
```typescript
// models/example.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IExample extends Document {
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const exampleSchema = new Schema<IExample>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true  // Add indexes for frequently queried fields
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,  // Auto-create createdAt/updatedAt
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;  // Remove version key from responses
        return ret;
      }
    }
  }
);

// Compound indexes for complex queries
exampleSchema.index({ email: 1, status: 1 });

export const Example = mongoose.model<IExample>('Example', exampleSchema);
```

**When to add indexes**:
- Fields you filter by (`find({ status: 'active' })`)
- Fields you sort by (`.sort({ createdAt: -1 })`)
- Fields used in lookups/joins
- Compound indexes for queries with multiple conditions

**Export pattern**:
```typescript
// models/index.ts
export { Example } from './example.model';
export type { IExample } from './example.model';
```

---

### 2. Repositories Layer (`repositories/`)

**Purpose**: Database queries only - the ONLY place that talks to MongoDB

**Rules**:
- ✅ All database operations (CRUD)
- ✅ Aggregation pipelines
- ✅ Return raw data
- ❌ NO business logic
- ❌ NO validation (let services handle it)
- ❌ NO external API calls

**Template**:
```typescript
// repositories/example.repository.ts
import { Example } from '../models';
import type { IExample } from '../models';
import { Types } from 'mongoose';

class ExampleRepository {
  // Create
  async create(data: Partial<IExample>): Promise<IExample> {
    const doc = new Example(data);
    return await doc.save();
  }

  // Read - Single
  async findById(id: string | Types.ObjectId): Promise<IExample | null> {
    return await Example.findById(id);
  }

  async findByEmail(email: string): Promise<IExample | null> {
    return await Example.findOne({ email }).lean();  // .lean() for better performance
  }

  // Read - Multiple
  async findAll(filters: any, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Example.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Example.countDocuments(filters)
    ]);

    return { data, total };
  }

  // Update
  async updateById(id: string | Types.ObjectId, updates: Partial<IExample>): Promise<IExample | null> {
    return await Example.findByIdAndUpdate(id, updates, { new: true });
  }

  // Delete
  async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    const result = await Example.findByIdAndDelete(id);
    return result !== null;
  }

  // Aggregations (for analytics)
  async getStatsByStatus() {
    return await Example.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  // Utilities
  async exists(email: string): Promise<boolean> {
    const count = await Example.countDocuments({ email });
    return count > 0;
  }
}

export default new ExampleRepository();  // Singleton pattern
```

**Common patterns**:

1. **Pagination**: Always use `skip` and `limit`
2. **Parallel queries**: Use `Promise.all()` for data + count
3. **Lean queries**: Use `.lean()` for read-only operations (faster)
4. **Aggregations**: For complex analytics, let MongoDB do the work

---

### 3. Services Layer (`services/`)

**Purpose**: Business logic - the brain of your application

**Rules**:
- ✅ All business logic lives here
- ✅ Orchestrate multiple repositories
- ✅ Call external APIs
- ✅ Data transformation
- ✅ Can call other services
- ❌ NO HTTP handling (req/res)
- ❌ NO database queries (use repositories)

**Template**:
```typescript
// services/example.service.ts
import exampleRepository from '../repositories/example.repository';
import auditService from './audit.service';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { isValidEmail } from '../helpers/validation';

class ExampleService {
  async createExample(data: { name: string; email: string }) {
    // 1. Validation
    if (!isValidEmail(data.email)) {
      throw new BadRequestError('Invalid email format');
    }

    // 2. Business logic
    const exists = await exampleRepository.exists(data.email);
    if (exists) {
      throw new BadRequestError('Email already exists');
    }

    // 3. Create record
    const example = await exampleRepository.create({
      name: data.name,
      email: data.email,
      status: 'active'
    });

    // 4. Side effects (audit, notifications, etc.)
    await auditService.log({
      action: 'EXAMPLE_CREATED',
      resource: example._id.toString(),
      metadata: { email: data.email }
    });

    // 5. Return transformed data
    return {
      id: example._id.toString(),
      name: example.name,
      email: example.email,
      createdAt: example.createdAt
    };
  }

  async getExampleById(id: string) {
    const example = await exampleRepository.findById(id);
    
    if (!example) {
      throw new NotFoundError('Example not found');
    }

    return example;
  }

  async listExamples(filters: any, page: number, limit: number) {
    return await exampleRepository.findAll(filters, { page, limit });
  }

  async updateExample(id: string, updates: Partial<any>) {
    const example = await exampleRepository.findById(id);
    
    if (!example) {
      throw new NotFoundError('Example not found');
    }

    return await exampleRepository.updateById(id, updates);
  }

  async deleteExample(id: string) {
    const deleted = await exampleRepository.deleteById(id);
    
    if (!deleted) {
      throw new NotFoundError('Example not found');
    }

    return { success: true };
  }
}

export default new ExampleService();
```

**Service communication**:
```typescript
// ✅ GOOD - Service calls another service
class OrderService {
  async createOrder(userId: string, productId: string) {
    const user = await userService.getUserById(userId);  // Call another service
    const product = await productService.getProductById(productId);
    
    // Business logic here
  }
}

// ❌ BAD - Service imports repository from another domain
class OrderService {
  async createOrder() {
    const user = await userRepository.findById(id);  // Don't do this!
    // Use userService.getUserById() instead
  }
}
```

---

### 4. Controllers Layer (`controllers/`)

**Purpose**: HTTP request/response handling - the API interface

**Rules**:
- ✅ Extract data from request (body, params, query)
- ✅ Call services
- ✅ Format responses
- ✅ Handle errors (pass to next)
- ❌ NO business logic
- ❌ NO database queries
- ❌ NO complex data transformation

**Template**:
```typescript
// controllers/example.controller.ts
import { Response, NextFunction } from 'express';
import exampleService from '../services/example.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { getPaginationParams } from '../utils/pagination';
import { AuthRequest } from '../middlewares';

class ExampleController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // 1. Extract data from request
      const { name, email } = req.body;
      const userId = req.user!.userId;  // From auth middleware

      // 2. Call service
      const example = await exampleService.createExample({ name, email });

      // 3. Send response
      return sendSuccess(res, example, SUCCESS_MESSAGES.CREATED, 201);
    } catch (error) {
      next(error);  // Pass to error middleware
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const example = await exampleService.getExampleById(id);
      
      return sendSuccess(res, example, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const result = await exampleService.listExamples({}, page, limit);
      
      return sendPaginated(
        res,
        result.data,
        { page, limit, total: result.total },
        SUCCESS_MESSAGES.DATA_FETCHED
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const example = await exampleService.updateExample(id, updates);
      
      return sendSuccess(res, example, SUCCESS_MESSAGES.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await exampleService.deleteExample(id);
      
      return sendSuccess(res, null, SUCCESS_MESSAGES.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export default new ExampleController();
```

**Controller checklist**:
- [ ] Wrapped in try-catch
- [ ] Calls `next(error)` on catch
- [ ] Uses response helpers (`sendSuccess`, `sendError`, `sendPaginated`)
- [ ] Extracts all needed data from request
- [ ] No business logic

---

### 5. Routes Layer (`routes/`)

**Purpose**: Define API endpoints and apply middlewares

**Rules**:
- ✅ Define HTTP methods and paths
- ✅ Apply middlewares in correct order
- ✅ Keep routes flat and readable
- ❌ NO business logic
- ❌ NO inline functions

**Template**:
```typescript
// routes/example.routes.ts
import { Router } from 'express';
import exampleController from '../controllers/example.controller';
import { 
  validate, 
  authenticate, 
  sanitizeBody 
} from '../middlewares';
import { 
  createExampleSchema, 
  updateExampleSchema 
} from '../validators/example.validator';

const router = Router();

// Public routes (no auth required)
router.get('/public', exampleController.getPublic);

// Protected routes (auth required) - apply authenticate to all routes below
router.use(authenticate);

// CREATE
router.post(
  '/',
  sanitizeBody,
  validate(createExampleSchema),
  exampleController.create
);

// READ
router.get('/', exampleController.getAll);
router.get('/:id', exampleController.getById);

// UPDATE
router.put(
  '/:id',
  sanitizeBody,
  validate(updateExampleSchema),
  exampleController.update
);

router.patch(
  '/:id',
  sanitizeBody,
  validate(updateExampleSchema),
  exampleController.update
);

// DELETE
router.delete('/:id', exampleController.delete);

export default router;
```

**Middleware order matters**:
```typescript
// ✅ CORRECT ORDER
router.post(
  '/example',
  authenticate,        // 1. Check auth first
  sanitizeBody,        // 2. Clean input
  validate(schema),    // 3. Validate
  rateLimit,          // 4. Rate limit
  controller.create   // 5. Handle request
);

// ❌ WRONG ORDER
router.post(
  '/example',
  rateLimit,          // Rate limit before auth? User can spam!
  validate(schema),   // Validate unsanitized input? Dangerous!
  authenticate,       // Auth last? Wasted processing!
  controller.create
);
```

**Combining routes**:
```typescript
// routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import exampleRoutes from './example.routes';

const router = Router();

router.use('/auth', authRoutes);       // /api/v1/auth/*
router.use('/examples', exampleRoutes); // /api/v1/examples/*

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

export default router;
```

---

### 6. Middlewares Layer (`middlewares/`)

**Purpose**: Intercept and process requests before they reach controllers

**Common middleware types**:

#### Authentication Middleware
```typescript
// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../helpers/jwt';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    next(error);
  }
};
```

#### Validation Middleware
```typescript
// middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,     // Show all errors
      stripUnknown: true     // Remove unknown fields (security)
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw new ValidationError('Validation failed', errors);
    }

    req[property] = value;  // Use validated/sanitized value
    next();
  };
};
```

#### Error Handler Middleware
```typescript
// middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path
  });

  // Custom app errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors && { errors: error.errors })
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
};
```

---

### 7. Validators Layer (`validators/`)

**Purpose**: Define validation schemas using Joi

**Template**:
```typescript
// validators/example.validator.ts
import Joi from 'joi';

export const createExampleSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  
  age: Joi.number()
    .integer()
    .min(18)
    .max(120)
    .optional()
    .messages({
      'number.min': 'Age must be at least 18',
      'number.max': 'Age must not exceed 120'
    }),
  
  status: Joi.string()
    .valid('active', 'inactive', 'pending')
    .optional()
    .default('pending')
});

export const updateExampleSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  age: Joi.number().integer().min(18).max(120).optional(),
  status: Joi.string().valid('active', 'inactive', 'pending').optional()
});

export const queryExampleSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  status: Joi.string().valid('active', 'inactive', 'pending').optional()
});
```

**Common validation patterns**:
- **Required fields**: `.required()`
- **Optional with default**: `.optional().default('value')`
- **Enums**: `.valid('option1', 'option2')`
- **Nested objects**: `Joi.object({ ... })`
- **Arrays**: `Joi.array().items(Joi.string())`
- **Custom messages**: `.messages({ ... })`

---

### 8. Utils & Helpers

#### Utils (Infrastructure)
```typescript
// utils/response.ts
import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T,
  pagination: { page: number; limit: number; total: number },
  message: string = 'Success'
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
}
```

```typescript
// utils/errors.ts
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: any;

  constructor(message: string, statusCode: number = 500, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errors?: any) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}
```

#### Helpers (Business Domain)
```typescript
// helpers/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { authConfig } from '../config';
import { UnauthorizedError } from '../utils/errors';

interface JwtPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JwtPayload, expiresIn?: string): string {
  const options: SignOptions = {
    expiresIn: expiresIn || authConfig.jwt.expiresIn
  };
  return jwt.sign(payload, authConfig.jwt.secret, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, authConfig.jwt.secret) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

---

## Code Flow & Data Movement

### Example: Creating a New Resource

**1. HTTP Request arrives**
```
POST /api/v1/examples
Headers: { Authorization: Bearer <token> }
Body: { name: "Test", email: "test@example.com" }
```

**2. Express App receives request**
```typescript
// app.ts
app.use(appConfig.apiPrefix, routes);  // Matches /api/v1/*
```

**3. Routes layer matches endpoint**
```typescript
// routes/index.ts
router.use('/examples', exampleRoutes);  // Matches /examples

// routes/example.routes.ts
router.post('/', authenticate, sanitizeBody, validate(schema), controller.create);
```

**4. Middlewares execute in order**
```typescript
// authenticate
req.user = { userId: '123', email: 'user@example.com' };

// sanitizeBody
req.body = { name: 'Test', email: 'test@example.com' };  // Sanitized

// validate
// Joi validates and transforms data
```

**5. Controller extracts and delegates**
```typescript
// controllers/example.controller.ts
const { name, email } = req.body;
const example = await exampleService.createExample({ name, email });
return sendSuccess(res, example, 'Created', 201);
```

**6. Service handles business logic**
```typescript
// services/example.service.ts
// Validate email
// Check if exists
const example = await exampleRepository.create(data);
// Log audit
return transformed data;
```

**7. Repository queries database**
```typescript
// repositories/example.repository.ts
const doc = new Example(data);
return await doc.save();
```

**8. Response flows back**
```typescript
Repository → Service → Controller → Express → HTTP Response
```

**9. Client receives**
```json
{
  "success": true,
  "message": "Created",
  "data": {
    "id": "...",
    "name": "Test",
    "email": "test@example.com"
  }
}
```

---

## Adding New Features

### Checklist: Adding a New Resource (e.g., "Product")

#### Phase 1: Data Layer
- [ ] **1. Create model** (`models/product.model.ts`)
  - Define schema
  - Add indexes
  - Export interface and model
  - Add to `models/index.ts`

- [ ] **2. Create repository** (`repositories/product.repository.ts`)
  - Basic CRUD methods
  - Custom query methods
  - Export singleton
  - Add to `repositories/index.ts`

#### Phase 2: Business Layer
- [ ] **3. Create service** (`services/product.service.ts`)
  - Create method
  - Get by ID method
  - List/search method
  - Update method
  - Delete method
  - Export singleton
  - Add to `services/index.ts`

#### Phase 3: API Layer
- [ ] **4. Create validators** (`validators/product.validator.ts`)
  - Create schema
  - Update schema
  - Query schema
  - Export schemas

- [ ] **5. Create controller** (`controllers/product.controller.ts`)
  - create handler
  - getById handler
  - getAll handler
  - update handler
  - delete handler
  - Export singleton

- [ ] **6. Create routes** (`routes/product.routes.ts`)
  - Define endpoints
  - Apply middlewares
  - Export router
  - Add to `routes/index.ts`

#### Phase 4: Testing
- [ ] **7. Write tests** (`tests/`)
  - Unit tests for service
  - Integration tests for API endpoints

#### Phase 5: Documentation
- [ ] **8. Update README**
  - Add new endpoints to API docs
  - Add example requests/responses

### Template for Quick Start

```bash
# Create all files at once
touch src/models/product.model.ts
touch src/repositories/product.repository.ts
touch src/services/product.service.ts
touch src/validators/product.validator.ts
touch src/controllers/product.controller.ts
touch src/routes/product.routes.ts
touch tests/integration/product.test.ts
```

---

## Common Patterns

### Pattern 1: Caching External API Calls

```typescript
// services/exchangeRate.service.ts
async getRate(from: string, to: string): Promise<number> {
  // 1. Check cache
  const cacheKey = `rate:${from}:${to}`;
  const cached = await redisClient.get(cacheKey);
  
  if (cached) {
    return parseFloat(cached);
  }

  // 2. Fetch from API
  const rate = await axios.get(externalApi);

  // 3. Cache result
  await redisClient.set(cacheKey, rate.toString(), 3600);  // 1 hour

  return rate;
}
```

### Pattern 2: Audit Logging

```typescript
// services/audit.service.ts
async log(data: AuditLogData): Promise<void> {
  try {
    await auditLogRepository.create(data);
  } catch (error) {
    // Don't let audit failures break main flow
    logger.error('Audit log failed:', error);
  }
}

// Usage in other services
async createUser(data: UserData) {
  const user = await userRepository.create(data);
  
  // Fire and forget - don't await
  auditService.log({
    userId: user._id,
    action: 'USER_CREATED',
    metadata: { email: user.email }
  });
  
  return user;
}
```

### Pattern 3: Pagination

```typescript
// utils/pagination.ts
export function getPaginationParams(query: any) {
  const page = Math.max(1, parseInt(query.page || 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 10, 10)));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

// Usage in controller
async getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const result = await service.list(page, limit);
    
    return sendPaginated(
      res,
      result.data,
      { page, limit, total: result.total }
    );
  } catch (error) {
    next(error);
  }
}
```

### Pattern 4: Soft Delete

```typescript
// models/product.model.ts
const productSchema = new Schema({
  name: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
});

// Repository
async softDelete(id: string) {
  return await Product.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date()
  });
}

async findActive() {
  return await Product.find({ isDeleted: false });
}
```

### Pattern 5: Transaction Handling (MongoDB)

```typescript
// Service with transaction
async transferBalance(fromUserId: string, toUserId: string, amount: number) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Deduct from sender
    await userRepository.updateBalance(fromUserId, -amount, { session });
    
    // Add to receiver
    await userRepository.updateBalance(toUserId, amount, { session });
    
    // Commit transaction
    await session.commitTransaction();
    
    return { success: true };
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### Pattern 6: File Upload Handling

```typescript
// middlewares/upload.middleware.ts
import multer from 'multer';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// Route
router.post('/upload', authenticate, upload.single('image'), controller.upload);

// Controller
async upload(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    
    if (!file) {
      throw new BadRequestError('No file uploaded');
    }
    
    const result = await fileService.processUpload(file);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
```

### Pattern 7: Background Jobs (with Bull)

```typescript
// jobs/email.job.ts
import Queue from 'bull';

export const emailQueue = new Queue('email', {
  redis: { host: 'localhost', port: 6379 }
});

emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  await sendEmail(to, subject, body);
});

// Usage in service
async createUser(data: UserData) {
  const user = await userRepository.create(data);
  
  // Add job to queue (non-blocking)
  await emailQueue.add({
    to: user.email,
    subject: 'Welcome',
    body: 'Welcome to our platform'
  });
  
  return user;
}
```

### Pattern 8: Rate Limiting per User

```typescript
// middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

export const userRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient.getClient(),
    prefix: 'rl:user:'
  }),
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: async (req: AuthRequest) => {
    // Premium users get higher limits
    const user = await userRepository.findById(req.user!.userId);
    return user.isPremium ? 1000 : 100;
  },
  keyGenerator: (req: AuthRequest) => req.user!.userId
});
```

---

## Testing Strategy

### Unit Tests (Fast, Isolated)

**What to test**:
- Helpers (pure functions)
- Services (business logic)
- Utilities

**Example**:
```typescript
// tests/unit/helpers/jwt.test.ts
import { generateToken, verifyToken } from '../../../src/helpers/jwt';

describe('JWT Helper', () => {
  const payload = { userId: '123', email: 'test@example.com' };

  it('should generate valid token', () => {
    const token = generateToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify valid token', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid')).toThrow();
  });
});
```

### Integration Tests (Slower, Full Stack)

**What to test**:
- API endpoints
- Full request/response cycle
- Middleware chain
- Database interactions

**Example**:
```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Another User'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });
});
```

### Test Setup

```typescript
// tests/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Environment Variables**
  - [ ] All secrets in environment (not hardcoded)
  - [ ] Production database URLs
  - [ ] API keys secured
  - [ ] JWT secret is strong and unique

- [ ] **Database**
  - [ ] Indexes created
  - [ ] Migrations run (if applicable)
  - [ ] Backup strategy in place

- [ ] **Security**
  - [ ] Rate limiting configured
  - [ ] CORS origins whitelisted
  - [ ] Helmet.js enabled
  - [ ] Input sanitization working

- [ ] **Performance**
  - [ ] Redis caching enabled
  - [ ] Database queries optimized
  - [ ] Pagination on all list endpoints

- [ ] **Error Handling**
  - [ ] All routes have error handlers
  - [ ] Logging configured
  - [ ] Error messages sanitized for production

- [ ] **Testing**
  - [ ] All tests passing
  - [ ] Critical paths tested
  - [ ] Edge cases covered

### Deployment (Render/Railway/Heroku)

1. **Build Command**: `npm ci && npm run build`
2. **Start Command**: `node dist/server.js`
3. **Environment Variables**: Set all required vars
4. **Health Check**: Configure `/api/v1/health` endpoint

### Post-Deployment

- [ ] Health check endpoint responds
- [ ] Can register new user
- [ ] Can login
- [ ] Can create resource
- [ ] Logs are being captured
- [ ] Database connections stable
- [ ] Redis connected

---

## Environment Variables Guide

### Required Variables

```bash
# Application
NODE_ENV=production
PORT=10000
API_PREFIX=/api/v1

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Redis
REDIS_URL=redis://hostname:6379

# Authentication
JWT_SECRET=<generate-random-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=10

# External APIs
EXCHANGE_RATE_API_URL=https://api.exchangerate.host
EXCHANGE_RATE_API_KEY=optional
EXCHANGE_RATE_CACHE_TTL=3600
EXCHANGE_RATE_TIMEOUT=5000

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Generating Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

---

## Common Pitfalls & Solutions

### ❌ Problem 1: Circular Dependencies

**Bad**:
```typescript
// service-a.ts
import serviceB from './service-b';

// service-b.ts
import serviceA from './service-a';  // CIRCULAR!
```

**Solution**: Create a third service to orchestrate
```typescript
// orchestrator.service.ts
import serviceA from './service-a';
import serviceB from './service-b';

class OrchestratorService {
  async doSomething() {
    const dataA = await serviceA.getData();
    const dataB = await serviceB.processData(dataA);
    return dataB;
  }
}
```

### ❌ Problem 2: Business Logic in Controllers

**Bad**:
```typescript
// controller
async create(req, res) {
  const { email } = req.body;
  
  // Validation in controller? NO!
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  // Business logic in controller? NO!
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ error: 'Email exists' });
  }
  
  const user = await User.create(req.body);
  res.json(user);
}
```

**Good**:
```typescript
// controller - thin layer
async create(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

// service - business logic
async createUser(data) {
  if (!isValidEmail(data.email)) {
    throw new BadRequestError('Invalid email');
  }
  
  const exists = await userRepository.exists(data.email);
  if (exists) {
    throw new ConflictError('Email already exists');
  }
  
  return await userRepository.create(data);
}
```

### ❌ Problem 3: Not Using Transactions

**Bad**:
```typescript
// Money transfer without transaction
async transfer(fromId, toId, amount) {
  await accountRepository.deduct(fromId, amount);
  // What if this fails? Money disappears!
  await accountRepository.add(toId, amount);
}
```

**Good**:
```typescript
async transfer(fromId, toId, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await accountRepository.deduct(fromId, amount, { session });
    await accountRepository.add(toId, amount, { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### ❌ Problem 4: N+1 Query Problem

**Bad**:
```typescript
// Get users and their posts
const users = await User.find();  // 1 query

for (const user of users) {
  user.posts = await Post.find({ userId: user._id });  // N queries!
}
```

**Good**:
```typescript
// Use aggregation or populate
const users = await User.find().populate('posts');  // 1-2 queries

// Or aggregation
const users = await User.aggregate([
  {
    $lookup: {
      from: 'posts',
      localField: '_id',
      foreignField: 'userId',
      as: 'posts'
    }
  }
]);
```

### ❌ Problem 5: Forgetting to Hash Passwords

**Bad**:
```typescript
async createUser(data) {
  return await User.create(data);  // Password stored in plain text!
}
```

**Good**:
```typescript
async createUser(data) {
  const hashedPassword = await hashPassword(data.password);
  return await User.create({
    ...data,
    password: hashedPassword
  });
}
```

### ❌ Problem 6: Exposing Sensitive Data

**Bad**:
```typescript
async login(email, password) {
  const user = await User.findOne({ email });  // Returns password!
  return user;
}
```

**Good**:
```typescript
// In model
const userSchema = new Schema({
  password: {
    type: String,
    select: false  // Don't include by default
  }
});

// In service
async login(email, password) {
  const user = await User.findOne({ email }).select('+password');  // Explicit
  // Verify password
  // Return user WITHOUT password
  return {
    id: user._id,
    email: user.email,
    name: user.name
  };
}
```

---

## Quick Reference: File Templates

### New Model Template
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IResourceName extends Document {
  field1: string;
  field2: number;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResourceName>(
  {
    field1: { type: String, required: true },
    field2: { type: Number, required: true }
  },
  { timestamps: true }
);

export const ResourceName = mongoose.model<IResourceName>('ResourceName', resourceSchema);
```

### New Repository Template
```typescript
import { ResourceName } from '../models';
import type { IResourceName } from '../models';

class ResourceNameRepository {
  async create(data: Partial<IResourceName>): Promise<IResourceName> {
    const doc = new ResourceName(data);
    return await doc.save();
  }

  async findById(id: string): Promise<IResourceName | null> {
    return await ResourceName.findById(id);
  }

  async findAll(filters: any, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ResourceName.find(filters).skip(skip).limit(limit).lean(),
      ResourceName.countDocuments(filters)
    ]);

    return { data, total };
  }

  async updateById(id: string, updates: Partial<IResourceName>): Promise<IResourceName | null> {
    return await ResourceName.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await ResourceName.findByIdAndDelete(id);
    return result !== null;
  }
}

export default new ResourceNameRepository();
```

### New Service Template
```typescript
import resourceRepository from '../repositories/resource.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';

class ResourceService {
  async create(data: any) {
    // Validation
    // Business logic
    const resource = await resourceRepository.create(data);
    return resource;
  }

  async getById(id: string) {
    const resource = await resourceRepository.findById(id);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    return resource;
  }

  async list(filters: any, page: number, limit: number) {
    return await resourceRepository.findAll(filters, { page, limit });
  }

  async update(id: string, updates: any) {
    const resource = await this.getById(id);
    return await resourceRepository.updateById(id, updates);
  }

  async delete(id: string) {
    const resource = await this.getById(id);
    await resourceRepository.deleteById(id);
    return { success: true };
  }
}

export default new ResourceService();
```

### New Controller Template
```typescript
import { Response, NextFunction } from 'express';
import resourceService from '../services/resource.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { AuthRequest } from '../middlewares';

class ResourceController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const resource = await resourceService.create(data);
      return sendSuccess(res, resource, 'Created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const resource = await resourceService.getById(id);
      return sendSuccess(res, resource);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const result = await resourceService.list({}, page, limit);
      return sendPaginated(res, result.data, { page, limit, total: result.total });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const resource = await resourceService.update(id, updates);
      return sendSuccess(res, resource, 'Updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await resourceService.delete(id);
      return sendSuccess(res, null, 'Deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new ResourceController();
```

### New Routes Template
```typescript
import { Router } from 'express';
import resourceController from '../controllers/resource.controller';
import { validate, authenticate, sanitizeBody } from '../middlewares';
import { createSchema, updateSchema } from '../validators/resource.validator';

const router = Router();

router.use(authenticate);  // All routes require auth

router.post('/', sanitizeBody, validate(createSchema), resourceController.create);
router.get('/', resourceController.getAll);
router.get('/:id', resourceController.getById);
router.put('/:id', sanitizeBody, validate(updateSchema), resourceController.update);
router.delete('/:id', resourceController.delete);

export default router;
```

---

## Final Checklist: Starting a New Project

### Initial Setup
- [ ] Clone template repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Update `.env` with your values
- [ ] Start MongoDB and Redis
- [ ] Run `npm run dev` to verify setup

### Building Your First Feature
- [ ] Create model with schema and indexes
- [ ] Create repository with CRUD methods
- [ ] Create service with business logic
- [ ] Create validators for input
- [ ] Create controller to handle HTTP
- [ ] Create routes with middleware chain
- [ ] Write tests (unit + integration)
- [ ] Test manually with Postman/curl
- [ ] Update API documentation

### Before Committing
- [ ] Code follows layered architecture
- [ ] No circular dependencies
- [ ] All routes have error handlers
- [ ] Sensitive data not exposed
- [ ] Tests passing
- [ ] Linter passing
- [ ] Console.logs removed

### Before Deploying
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Caching strategy implemented
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Error messages sanitized
- [ ] Health check endpoint working
- [ ] Build command successful
- [ ] All tests green

---

## Summary: The 10 Commandments

1. **Thou shalt respect the dependency flow**: Routes → Controllers → Services → Repositories → Models

2. **Thou shalt not put business logic in controllers**: Controllers are HTTP handlers only

3. **Thou shalt not query the database outside repositories**: All database queries go through repositories

4. **Thou shalt use middlewares for cross-cutting concerns**: Auth, validation, logging, rate limiting

5. **Thou shalt handle all errors**: Every async function needs try-catch, every route needs error handling

6. **Thou shalt validate all inputs**: Use Joi schemas, sanitize user input

7. **Thou shalt not expose sensitive data**: Hash passwords, exclude sensitive fields, sanitize errors

8. **Thou shalt optimize database queries**: Add indexes, use pagination, avoid N+1 queries

9. **Thou shalt test thy code**: Write unit tests for logic, integration tests for APIs

10. **Thou shalt document thy work**: Clear code, good naming, README updated

---

## Need Help?

### Common Commands
```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled code

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
```

### Debugging Tips
1. **Check logs**: `logs/combined.log` and `logs/error.log`
2. **Use debugger**: Add `debugger;` in code, run with `node --inspect`
3. **Test in isolation**: Write unit tests for specific functions
4. **Check environment**: Verify all env vars are set
5. **Database issues**: Check connection string, indexes, permissions

### Resources
- MongoDB Docs: https://docs.mongodb.com
- Express Docs: https://expressjs.com
- Joi Validation: https://joi.dev
- TypeScript Docs: https://www.typescriptlang.org

---

**You're now ready to build scalable, maintainable REST APIs!** 🚀

Use this guide as your reference bible. When in doubt, follow the patterns here. Good luck!