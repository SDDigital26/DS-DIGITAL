-- An AI browser session hash maps to exactly one server-side conversation.
-- The previous route did not persist conversations; if a local DB was manually
-- seeded with duplicate sessionKey values, resolve them before applying this index.
CREATE UNIQUE INDEX "AiConversation_sessionKey_key" ON "AiConversation"("sessionKey");

-- Replace the old non-unique lookup index with the unique index above.
DROP INDEX IF EXISTS "AiConversation_sessionKey_idx";
