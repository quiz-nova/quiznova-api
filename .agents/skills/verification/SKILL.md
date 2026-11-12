---
name: verification
description:
  Enforces code quality and build standards for the QuizNova backend API.
---

# Code Verification Skill

Use this skill to ensure that the backend codebase remains healthy, formatted,
and buildable after any changes.

## Backend Verification (ASP.NET Core)

When changes are made to the backend projects, execute the following commands
from the repository root:

1. **Format Check:**

   ```bash
   dotnet format QuizNova.slnx --verify-no-changes
   ```

   _Auto-fix formatting issues:_

   ```bash
   dotnet format QuizNova.slnx
   ```

2. **Build Verification:**

   ```bash
   dotnet build --warningsaserrors
   ```

3. **Test Execution:**

   ```bash
   dotnet test
   ```

## Pre-commit Hooks

The project uses Husky to verify backend formatting before every commit:

- **Backend:** `dotnet format QuizNova.slnx --verify-no-changes` checks the
  entire solution.
- If the hook fails, the commit is blocked — fix the issues and try again.
- To skip hooks (emergency only): `git commit --no-verify`

## CI Enforcement

GitHub Actions (`.github/workflows/build-and-test.yml`) enforces on every
push/PR:

| Check              | Command                             |
| :----------------- | :---------------------------------- |
| Backend formatting | `dotnet format --verify-no-changes` |
| Backend build      | `dotnet build --warningsaserrors`   |
| Backend tests      | `dotnet test`                       |

## Guidelines

- Always run these verifications before concluding a task that involved code
  changes.
- If a verification step fails, address the issues before proceeding or
  completing the task.
- Ensure that the .NET SDK is properly configured before running these commands.
