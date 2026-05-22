# Backend P# Backend Folder Structure

A reference guide for the `commonlands-backend` source layout, conventions, and where each type of code lives.

---

## Top-Level `src/` Layout

```
src/
├── core/
├── lib/
└── modules/
    └──
        ├── application/
        ├── domain/
        ├── infrastructure/
        └── presentation/
```

---

## `core/`

Contains **application-specific foundational code** — things that are essential to this app's runtime but are not reusable outside of it. If this folder were deleted, the application would not start.

```
core/
├── config/           # ConfigModule setup, env validation (Joi/Zod schemas)
├── decorators/       # App-level decorators tied to domain (e.g. @CurrentUser, @Roles)
├── filters/          # Global exception filters (HttpExceptionFilter, AllExceptionsFilter)
├── guards/           # Global guards (JwtAuthGuard, RolesGuard)
├── interceptors/     # Global interceptors (LoggingInterceptor, VaultInterceptor, TransformInterceptor)
├── middleware/       # Request middleware (correlation IDs, request logging)
└── pipes/            # Global pipes (ValidationPipe setup, ParseObjectIdPipe)
```

**Rules:**

- May import from `lib/` but never from `modules/`
- Code here is wired up once in `AppModule` or `main.ts`
- Domain-aware (knows about your app's concepts like users, tokens, vaults)

---

## `lib/`

Contains **generic, reusable utilities** with zero knowledge of this application's domain. Code here could theoretically be extracted into a standalone npm package and used in any other project.

```
lib/
├── constants/        # Shared constant values (pagination defaults, regex patterns)
├── dto/              # Generic base DTOs (PaginatedResponseDto, BaseResponseDto)
├── interfaces/       # Shared TypeScript interfaces and types (IPageable, ITimestamped)
├── types/            # Utility types and type guards
└── utils/            # Pure helper functions (paginate, slugify, deepMerge, formatPhone)
```

**Rules:**

- Zero imports from `core/` or `modules/`
- No NestJS-specific decorators (no `@Injectable`, no `@Module`)
- Pure functions and plain classes only
- Ask yourself: _"Could I paste this into a completely different project unchanged?"_ — if yes, it belongs here

---

## `modules/`

Each feature of the application lives in its own module folder. Modules follow a **Clean Architecture** layer structure with four sub-folders.

### Module Layer Structure

Every module is divided into four layers. Dependencies flow **inward only** — outer layers depend on inner ones, never the reverse.

```
<module>/
├── application/
├── domain/
├── infrastructure/
└── presentation/
```

---

### `domain/`

The **innermost layer**. Contains pure business logic and rules with no framework or infrastructure dependencies.

```
domain/
├── entities/         # Core domain models / Mongoose schemas
├── interfaces/       # Abstractions that infrastructure must implement (IUserRepository, ICacheStore)
├── value-objects/    # Immutable value types (PhoneNumber, Coordinates)
└── errors/           # Domain-specific error classes (UserNotFoundError, InvalidOtpError)
```

**Rules:**

- No NestJS imports (no `@Injectable`, no HTTP exceptions)
- No Mongoose, no Redis, no AWS SDKs
- Interfaces here are the contracts; infrastructure provides the implementations
- This layer should read like plain TypeScript business logic

---

### `application/`

The **use-case layer**. Orchestrates domain objects and calls infrastructure via interfaces to fulfill a single business operation.

```
application/
├── use-cases/        # One class per operation (LoginUseCase, SendOtpUseCase, VerifyLivenessUseCase)
├── dtos/             # Input/output DTOs for use cases (LoginDto, SendOtpDto)
└── interfaces/       # Application-level service interfaces (ITokenService, IMessageSender)
```

**Rules:**

- Use cases receive interfaces (injected via DI tokens), never concrete implementations
- HTTP exceptions (`BadRequestException`, `UnauthorizedException`) are **only thrown here**, never in the domain or infrastructure layers
- One use case = one public `execute()` method
- No direct Mongoose model usage — go through repository interfaces

---

### `infrastructure/`

The **outer implementation layer**. Provides concrete implementations for all interfaces defined in `domain/` and `application/`.

```
infrastructure/
├── repositories/     # Mongoose repository implementations (UserRepository implements IUserRepository)
├── cache/            # Redis cache implementations (RedisCacheStore implements ICacheStore)
├── messaging/        # Twilio / SNS implementations (TwilioMessageSender implements IMessageSender)
├── aws/              # AWS SDK wrappers (SecretsManager, Rekognition, KMS, DynamoDB)
└── persistence/      # Mongoose schema definitions and model providers
```

**Rules:**

- Implements interfaces from `domain/interfaces/` and `application/interfaces/`
- All third-party SDK calls (Mongoose, Redis, Twilio, AWS) are isolated here
- Never imported directly by use cases — only injected via DI tokens
- Database/infrastructure errors should be caught here and rethrown as domain errors if needed

---

### `presentation/`

The **HTTP layer**. Handles incoming requests, delegates to use cases, and shapes the HTTP response.

```
presentation/
├── controllers/      # NestJS controllers (@Controller, @Get, @Post, etc.)
└── guards/           # Route-specific guards (not global ones — those live in core/)
```

**Rules:**

- Controllers call use cases only — no business logic here
- Request validation happens via DTOs with `class-validator` decorators
- Response shaping (mapping use-case output to HTTP response) is the only logic allowed
- Module-specific guards (e.g. a guard that only applies to one route group) live here; global guards live in `core/guards/`

---

## Dependency Flow Summary

```
presentation  →  application  →  domain
                     ↓
              infrastructure  →  domain (implements interfaces)

lib  →  (used by any layer)
core →  (wired globally in AppModule)
```

Outer layers depend on inner ones. The `domain` layer depends on nothing internal.

---

## Quick Reference

| What you're adding                     | Where it goes                                 |
| -------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| New business rule or entity            | `modules/<feature>/domain/`                   |
| New use case (e.g. `ResendOtpUseCase`) | `modules/<feature>/application/use-cases/`    |
| New repository or AWS integration      | `modules/<feature>/infrastructure/`           |
| New HTTP endpoint                      | `modules/<feature>/presentation/controllers/` |
| Global JWT guard                       | `core/guards/`                                |
| Global logging interceptor             | `core/interceptors/`                          |
| Generic pagination helper              | `lib/utils/`                                  |
| Shared base DTO                        | `lib/dto/`                                    | — Reusable utilities (date helpers, string utils, logging wrappers, type guards). |
