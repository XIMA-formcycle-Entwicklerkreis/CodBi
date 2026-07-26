-- =============================================================================
-- Cleanup script for codbi_ai_prompt table
-- =============================================================================
-- Run this script manually if the CodBi plugin is uninstalled and Liquibase
-- rollback was not executed automatically.
--
-- The codbi_ai_prompt table stores AI system prompts that were seeded from
-- classpath resource files. It is safe to drop when the plugin is uninstalled
-- because the prompts are always reseeded from resources on reinstall.
-- =============================================================================

DROP TABLE IF EXISTS codbi_ai_prompt;
