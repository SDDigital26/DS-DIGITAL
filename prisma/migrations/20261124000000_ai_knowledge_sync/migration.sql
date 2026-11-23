-- AlterTable
ALTER TABLE "AiKnowledgeItem" ADD COLUMN "source" VARCHAR(40),
ADD COLUMN "sourceKey" VARCHAR(200);

-- CreateIndex
CREATE UNIQUE INDEX "AiKnowledgeItem_locale_sourceKey_key" ON "AiKnowledgeItem"("locale", "sourceKey");
