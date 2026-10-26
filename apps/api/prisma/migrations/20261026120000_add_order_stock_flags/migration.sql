
ALTER TABLE "orders"
ADD COLUMN "stockReserved" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "orders"
ADD COLUMN "stockReleased" BOOLEAN NOT NULL DEFAULT false;
