CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "Users" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "Email" varchar(180) NOT NULL UNIQUE,
  "PasswordHash" text NOT NULL,
  "FullName" varchar(160) NOT NULL,
  "Phone" varchar(40) NOT NULL,
  "City" varchar(120) NOT NULL,
  "Role" integer NOT NULL DEFAULT 0,
  "IsBlocked" boolean NOT NULL DEFAULT false,
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Categories" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "Slug" varchar(80) NOT NULL UNIQUE,
  "Title" varchar(120) NOT NULL,
  "Description" varchar(300) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Products" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "Sku" varchar(100) NOT NULL UNIQUE,
  "Title" varchar(220) NOT NULL,
  "Subtitle" text NOT NULL,
  "Brand" varchar(100) NOT NULL,
  "Price" numeric(12,2) NOT NULL,
  "PreviousPrice" numeric(12,2),
  "Badge" text NOT NULL,
  "Rating" double precision NOT NULL,
  "ReviewsCount" integer NOT NULL,
  "ImageUrl" text NOT NULL,
  "Description" text NOT NULL,
  "ManufacturerUrl" varchar(500) NOT NULL,
  "Specifications" text NOT NULL,
  "StockQuantity" integer NOT NULL,
  "CategoryId" uuid NOT NULL REFERENCES "Categories"("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "CartItems" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
  "ProductId" uuid NOT NULL REFERENCES "Products"("Id") ON DELETE RESTRICT,
  "Quantity" integer NOT NULL,
  UNIQUE ("UserId", "ProductId")
);

CREATE TABLE IF NOT EXISTS "FavoriteItems" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
  "ProductId" uuid NOT NULL REFERENCES "Products"("Id") ON DELETE RESTRICT,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("UserId", "ProductId")
);

CREATE TABLE IF NOT EXISTS "Reviews" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
  "ProductId" uuid NOT NULL REFERENCES "Products"("Id") ON DELETE CASCADE,
  "Rating" integer NOT NULL,
  "Text" varchar(1200) NOT NULL,
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Orders" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "Number" text NOT NULL UNIQUE,
  "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
  "RecipientFullName" text NOT NULL,
  "RecipientPhone" text NOT NULL,
  "City" text NOT NULL,
  "DeliveryPoint" text NOT NULL,
  "PaymentMethod" text NOT NULL,
  "Comment" text NOT NULL,
  "Status" integer NOT NULL,
  "Total" numeric(12,2) NOT NULL,
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "OrderItems" (
  "Id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "OrderId" uuid NOT NULL REFERENCES "Orders"("Id") ON DELETE CASCADE,
  "ProductId" uuid NOT NULL REFERENCES "Products"("Id") ON DELETE RESTRICT,
  "ProductTitle" text NOT NULL,
  "UnitPrice" numeric(12,2) NOT NULL,
  "Quantity" integer NOT NULL
);
