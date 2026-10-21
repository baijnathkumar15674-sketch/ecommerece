
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Validate incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow frontend domains to access the API
  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",

      // Existing Vercel domains
      "https://ecommerce-jet.vercel.app",
      "https://ecommerce-xc88.vercel.app",
      "https://ecommerce-xc88-kt5j2z1u5.vercel.app",

      // Current SHOPORA frontend
      "https://ecommerece-mocha.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, "0.0.0.0");

  console.log(`SHOPORA API running on port ${port}`);
}

bootstrap();
