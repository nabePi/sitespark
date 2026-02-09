# TapSite Backend Development Guide

## Project Structure

The backend follows a clean architecture pattern with clear separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Routes**: Define API endpoints
- **Middleware**: Handle cross-cutting concerns (auth, validation, rate limiting)
- **Models**: Database schema (Prisma)

## Development Workflow

1. **Start PostgreSQL**: Ensure your database is running
2. **Run migrations**: `npm run db:migrate` after schema changes
3. **Generate Prisma client**: `npm run db:generate`
4. **Start dev server**: `npm run dev`

## Adding New Features

### 1. Database Changes

Edit `prisma/schema.prisma`, then:
```bash
npm run db:migrate -- --name your_migration_name
```

### 2. New API Endpoint

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Add validation schema in `src/utils/validation.ts`
4. Register route in `src/index.ts`

### 3. New Service

1. Create service class in appropriate `src/services/` subdirectory
2. Export singleton instance
3. Use dependency injection pattern for testability

## Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## Deployment

```bash
# Build for production
npm run build

# Run production server
npm start
```

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database exists

### Token Issues
- Check `JWT_SECRET` length (min 32 chars)
- Verify token hasn't expired
- Check system time is correct

### AI Generation Issues
- Verify `KIMI_API_KEY` is set
- Check API rate limits
- Fallback mode is automatically enabled on errors