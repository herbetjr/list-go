import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { runSeeders } from './seeders';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  try {
    const dataSource = app.get(DataSource);
    await runSeeders(dataSource);
  } catch (error) {
    console.warn('Aviso ao executar seeders:', error);
  }

  const config = new DocumentBuilder()
    .setTitle('Listas Compartilhadas API')
    .setDescription('API de Gestão de Listas Compartilhadas')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Servir frontend SPA caso os arquivos compilados estejam presentes
  const possibleClientPaths = [
    join(__dirname, '..'),           // Quando main.js roda em dist/server/main.js -> dist/
    process.cwd(),                   // Quando o processo é iniciado diretamente na pasta dist/
    join(__dirname, 'client'),
    join(__dirname, '..', 'client'),
    join(process.cwd(), 'client'),
    join(process.cwd(), 'dist'),
    join(process.cwd(), 'dist', 'client'),
    join(process.cwd(), '..', 'dist', 'client'),
    join(process.cwd(), '..', 'dist', 'spa'),
    join(process.cwd(), 'dist', 'spa'),
  ];
  const clientPath = possibleClientPaths.find((p) =>
    existsSync(join(p, 'index.html')),
  );

  if (clientPath) {
    const staticMiddleware = express.static || express.default?.static;
    if (typeof staticMiddleware === 'function') {
      app.use(staticMiddleware(clientPath));
    }
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (
        req.method === 'GET' &&
        !req.path.startsWith('/api') &&
        !req.path.startsWith('/docs')
      ) {
        return res.sendFile(join(clientPath, 'index.html'));
      }
      next();
    });
    console.log(`Servindo frontend SPA estático a partir de: ${clientPath}`);
  }

  if (process.env.PORT) {
    await app.listen(process.env.PORT);
    console.log(`Servidor Lista GO rodando via Passenger na porta/socket: ${process.env.PORT}`);
  } else {
    const port = 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Servidor Lista GO rodando em http://localhost:${port}`);
    console.log(`Endpoints da API em http://localhost:${port}/api`);
    console.log(`Documentação Swagger em http://localhost:${port}/docs`);
  }
}

void bootstrap();


