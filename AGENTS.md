# AGENT CODING GUIDELINES: VStream Backend

This document outlines the conventions, commands, and architectural patterns of the VStream project to ensure high-quality, idiomatic contributions by coding agents.

## 1. Project Overview

VStream is a Node.js Express backend application using MongoDB/Mongoose. The project exclusively uses **ES Module syntax (`import`/`export`)**.

## 2. Standard Commands

The following commands are essential for development, testing, and maintenance. All commands should be run from the project root.

| Task             | Command                  | Notes                                                                                                                                                                                                                                                                                                        |
| :--------------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Development**  | `npm run dev`            | Starts the server using `nodemon` and loads `.env` variables via `dotenv/config`.                                                                                                                                                                                                                            |
| **Formatting**   | `npx prettier --write .` | Formats all files according to `.prettierrc`. **ALWAYS run before committing.**                                                                                                                                                                                                                              |
| **Format Check** | `npx prettier --check .` | Verifies formatting without making changes.                                                                                                                                                                                                                                                                  |
| **Linting**      | _None Defined_           | No dedicated linting script or configuration (e.g., ESLint) was found. Agents should use internal static analysis tools to enforce best practices and avoid common anti-patterns (e.g., unused variables, missing error checks).                                                                             |
| **Testing**      | _None Defined_           | No testing framework (e.g., Jest, Mocha) or script was found.                                                                                                                                                                                                                                                |
| **Single Test**  | _Unknown_                | Since no test framework is defined, the command for running a single test is unknown. If tests are added, they must be run using the standard project script. **Default Action:** If adding tests, establish a framework (e.g., Jest) and a \`npm test\` script, then use: \`npx jest -- /path/to/test.js\`. |

## 3. Code Style Guidelines

All code changes must adhere to the following conventions, derived from existing codebase patterns and the \`.prettierrc\` configuration.

### 3.1. Formatting (Prettier Rules)

The official formatting standard must be strictly followed:

| Rule                | Setting                                                     |
| :------------------ | :---------------------------------------------------------- |
| **Indentation**     | 4 spaces (\`"tabWidth": 4\` in \`.prettierrc\`)             |
| **Quotes**          | Double Quotes (\`"singleQuote": false\` in \`.prettierrc\`) |
| **Semicolons**      | Required (\`"semi": true\` in \`.prettierrc\`)              |
| **Trailing Comma**  | \`es5\` (For objects, arrays, etc.)                         |
| **Bracket Spacing** | True (Space inside object literals: \`{ foo: bar }\`)       |

### 3.2. Naming Conventions

| Entity                  | Convention                        | Example                                       |
| :---------------------- | :-------------------------------- | :-------------------------------------------- |
| **Files/Routes**        | \`kebab-case\` (for route files)  | \`user.routes.js\`, \`auth.middelware.js\`    |
| **Controllers/Models**  | \`dot-case\` for part of the name | \`user.controller.js\`, \`video.model.js\`    |
| **Classes/Models**      | \`PascalCase\`                    | \`ApiError\`, \`ApiResponse\`, \`UserSchema\` |
| **Functions/Variables** | \`camelCase\`                     | \`uploadOnCloudinary\`, \`registerUser\`      |
| **Constants**           | \`ALL_CAPS_SNAKE_CASE\`           | \`DB_NAME\`                                   |

### 3.3. Module System

-   **Use ES Modules:** Always use \`import\` and \`export\` syntax. Never use \`require()\` or \`module.exports\`.
-   **Destructuring Exports:** Prefer named exports and destructuring imports.
    \`\`\`javascript
    // Good:
    import { ApiResponse } from "./ApiResponse.js";
    import { asyncHandler } from "../utils/asyncHandler.js";
    \`\`\`

### 3.4. Asynchronous and Error Handling

This is critical to the architecture. All controller functions must be wrapped for consistent error handling.

#### **Controller Functions**

-   Use the \`asyncHandler\` wrapper for all controller logic that interacts with \`req\`, \`res\`, and \`next\`.
    \`\`\`javascript
    // In src/utils/asyncHandler.js, a Promise-based wrapper is used:
    // const asyncHandler = (requestHandler) => {
    // return (req, res, next) => {
    // Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    // }
    // }

    // Usage in controllers:
    const registerUser = asyncHandler(async (req, res) => {
    // ... logic here
    });
    \`\`\`

#### **Custom Error and Response Classes**

-   **Expected Errors:** When an operation fails due to client input (e.g., missing data, unauthorized access, resource not found), throw an instance of \`ApiError\`.
    \`\`\`javascript
    throw new ApiError(401, "Invalid access token or refresh token");
    \`\`\`
-   **Standard Responses:** Use the \`ApiResponse\` class for all successful (HTTP status < 400) responses.
    \`\`\`javascript
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User registered successfully"));
    \`\`\`

### 3.5. Database & Mongoose

-   **Models:** Define Mongoose schemas and models in \`src/models/\`. The \`mongoose-aggregate-paginate-v2\` plugin is used and should be leveraged for paginated queries on aggregation results.
-   **Async:** Always use \`async\`/\`await\` with Mongoose operations.

## 4. Architectural Notes

-   **Separation of Concerns:** Logic is strictly separated into:
    -   \`src/models\`: Mongoose Schemas/Models.
    -   \`src/controllers\`: Request handling, business logic, and response formatting.
    -   \`src/routes\`: Express routing setup.
    -   \`src/middlewares\`: Express middleware for authentication, file handling (Multer), etc.
    -   \`src/utils\`: Utility functions (Async handler, API responses, Cloudinary upload).

## 5. Agent Instructions/Rules

No official \`.cursor/rules/\` or \`.github/copilot-instructions.md\` were found. Agents must adhere to the conventions defined above and the following high-level directives:

1.  **Safety:** Verify all file I/O operations (Multer, Cloudinary) and ensure secrets are only loaded via \`dotenv\` from environment variables.
2.  **Idempotency:** When implementing API endpoints, ensure actions are idempotent where applicable.
3.  **Code Review:** Before finalizing a change, check adjacent code for any unhandled edge cases or style deviations related to your modification.
