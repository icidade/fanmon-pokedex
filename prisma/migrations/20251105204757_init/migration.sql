-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "releasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Type" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "colorHex" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TypeRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceTypeId" TEXT NOT NULL,
    "targetTypeId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TypeRelationship_sourceTypeId_fkey" FOREIGN KEY ("sourceTypeId") REFERENCES "Type" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TypeRelationship_targetTypeId_fkey" FOREIGN KEY ("targetTypeId") REFERENCES "Type" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pokemon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "indexNumber" INTEGER NOT NULL,
    "generationId" TEXT NOT NULL,
    "classification" TEXT,
    "description" TEXT,
    "heightMeters" REAL,
    "weightKilograms" REAL,
    "primaryImageMediaId" TEXT,
    "primaryAudioMediaId" TEXT,
    "baseHp" INTEGER,
    "baseAttack" INTEGER,
    "baseDefense" INTEGER,
    "baseSpAttack" INTEGER,
    "baseSpDefense" INTEGER,
    "baseSpeed" INTEGER,
    "isLegendary" BOOLEAN NOT NULL DEFAULT false,
    "isMythical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    CONSTRAINT "Pokemon_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pokemon_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pokemon_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pokemon_primaryImageMediaId_fkey" FOREIGN KEY ("primaryImageMediaId") REFERENCES "PokemonMedia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pokemon_primaryAudioMediaId_fkey" FOREIGN KEY ("primaryAudioMediaId") REFERENCES "PokemonMedia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PokemonType" (
    "pokemonId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("pokemonId", "typeId"),
    CONSTRAINT "PokemonType_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PokemonType_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PokemonEvolution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromPokemonId" TEXT,
    "toPokemonId" TEXT,
    "trigger" TEXT,
    "level" INTEGER,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PokemonEvolution_fromPokemonId_fkey" FOREIGN KEY ("fromPokemonId") REFERENCES "Pokemon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PokemonEvolution_toPokemonId_fkey" FOREIGN KEY ("toPokemonId") REFERENCES "Pokemon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PokemonMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pokemonId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PokemonMedia_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Generation_number_key" ON "Generation"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Type_name_key" ON "Type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Type_slug_key" ON "Type"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TypeRelationship_sourceTypeId_targetTypeId_relation_key" ON "TypeRelationship"("sourceTypeId", "targetTypeId", "relation");

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_slug_key" ON "Pokemon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_primaryImageMediaId_key" ON "Pokemon"("primaryImageMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_primaryAudioMediaId_key" ON "Pokemon"("primaryAudioMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_indexNumber_generationId_key" ON "Pokemon"("indexNumber", "generationId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonType_pokemonId_slot_key" ON "PokemonType"("pokemonId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonEvolution_fromPokemonId_toPokemonId_key" ON "PokemonEvolution"("fromPokemonId", "toPokemonId");
