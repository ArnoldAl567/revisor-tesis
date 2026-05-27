import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../.env'),
];
for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ThesisReview API')
    .setDescription('Revisión de tesis con IA — documentación REST')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT) || 3001;

  try {
    await app.listen(port);
    console.log(`API escuchando en http://localhost:${port}`);
    console.log(`Swagger: http://localhost:${port}/docs`);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === 'EADDRINUSE') {
      console.error(`
Puerto ${port} ya está en uso (otra instancia de la API sigue corriendo).

Solución:
  1. Cierra la otra terminal donde ejecutaste "npm run start:dev", o
  2. En apps/api ejecuta:  npm run stop
  3. Luego vuelve a iniciar: npm run start:dev
`);
      process.exit(1);
    }
    throw error;
  }
}

bootstrap();
