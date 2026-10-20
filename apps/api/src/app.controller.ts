
import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      success: true,
      message: "Welcome to SHOPORA API",
    };
  }

  @Get("health")
  getHealth() {
    return {
      success: true,
      status: "healthy",
      service: "shopora-api",
      timestamp: new Date().toISOString(),
    };
  }
}
