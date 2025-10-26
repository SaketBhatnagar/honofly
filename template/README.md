# honofly

HonoFly is the ultimate lightweight, migration-friendly Hono template 🚀. Designed for easy migration between Hono, Express, and NestJS, it includes JWT auth, RBAC, logging, database support, and Docker deployment. Want to switch frameworks? Just update the app/ directory! 🔄🔥

# HonoFly structure

HonoFly/
├── src/
│ ├── app/  
│ │ ├── HonoApp.ts # Hono-specific app setup
│ │ ├── Middleware.ts # Register global middlewares
│ │ ├── Routes.ts # Register API routes
│ ├── controllers/  
│ │ ├── UserController.ts # Handles HTTP logic
│ ├── services/  
│ │ ├── UserService.ts # Business logic (Framework-independent)
│ ├── repositories/  
│ │ ├── UserRepository.ts # Database interactions
│ ├── middlewares/  
│ │ ├── authMiddleware.ts # JWT Authentication
│ │ ├── rbacMiddleware.ts # Role-based Access Control
│ │ ├── loggerMiddleware.ts # Logging Middleware
│ │ ├── corsMiddleware.ts # CORS Middleware
│ │ ├── errorMiddleware.ts # Global Error Handling
│ ├── config/  
│ │ ├── Config.ts # Centralized environment configuration
│ ├── models/  
│ │ ├── UserModel.ts # Database schema
│ ├── utils/  
│ │ ├── ApiResponse.ts # Standardized API responses
│ ├── scripts/  
│ │ ├── migrateFramework.ts # Automated script for switching frameworks
│ ├── docker/  
│ │ ├── Dockerfile # Docker support
│ │ ├── docker-compose.yml # Docker Compose for database
│ ├── index.ts # Entry point
│ ├── package.json
│ ├── .env
│ ├── README.md
