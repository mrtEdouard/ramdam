import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Le fichier .env est à la racine du monorepo, partagé avec Docker Compose.
config({ path: '../../.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Vide en CI : `prisma generate` n'a pas besoin de la base.
    url: process.env.DATABASE_URL ?? '',
  },
});
