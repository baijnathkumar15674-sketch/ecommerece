import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
  rawBody: true,
});

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);

app.enableCors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://ecommerce-jet.vercel.app",
    "https://ecommerce-xc88.vercel.app",
    "https://ecommerce-xc88-kt5j2z1u5.vercel.app",
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});


  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, "0.0.0.0");
  console.log(`SHOPORA API running on http://localhost:${port}`);
}

bootstrap();
