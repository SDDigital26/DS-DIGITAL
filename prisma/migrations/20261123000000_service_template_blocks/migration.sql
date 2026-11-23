-- Дополнительные блоки шаблона страницы услуги (ТЗ Док.2 §7.2)
ALTER TABLE "ServiceTranslation" ADD COLUMN "result" TEXT;
ALTER TABLE "ServiceTranslation" ADD COLUMN "audience" TEXT;
ALTER TABLE "ServiceTranslation" ADD COLUMN "timeline" TEXT;
