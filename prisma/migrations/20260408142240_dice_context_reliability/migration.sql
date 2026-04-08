-- CreateEnum
CREATE TYPE "SessionEventType" AS ENUM ('ROLL_RESOLVED', 'QUEST_STAGE_ADVANCED', 'NPC_RELATION_CHANGED', 'ITEM_ADDED', 'ITEM_REMOVED', 'LORE_DISCOVERED', 'COMMITMENT_RECORDED');

-- CreateEnum
CREATE TYPE "MemoryFactType" AS ENUM ('PINNED', 'COMPACT', 'COMMITMENT');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "snapshotVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "metadataJson" JSONB;

-- CreateTable
CREATE TABLE "SessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "type" "SessionEventType" NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionMemoryFact" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "MemoryFactType" NOT NULL,
    "fact" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionMemoryFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedRequest" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionEvent_sessionId_turnNumber_idx" ON "SessionEvent"("sessionId", "turnNumber");

-- CreateIndex
CREATE INDEX "SessionMemoryFact_sessionId_type_isActive_idx" ON "SessionMemoryFact"("sessionId", "type", "isActive");

-- CreateIndex
CREATE INDEX "ProcessedRequest_sessionId_route_idx" ON "ProcessedRequest"("sessionId", "route");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedRequest_sessionId_route_idempotencyKey_key" ON "ProcessedRequest"("sessionId", "route", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "SessionEvent" ADD CONSTRAINT "SessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionMemoryFact" ADD CONSTRAINT "SessionMemoryFact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedRequest" ADD CONSTRAINT "ProcessedRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
