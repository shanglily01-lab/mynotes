-- Article: rename summary -> summaryPath (TEXT -> VARCHAR(500))
ALTER TABLE `Article`
  CHANGE `summary` `summaryPath` VARCHAR(500) NOT NULL DEFAULT '';

-- PlanItem: rename content -> contentPath (TEXT -> VARCHAR(500))
ALTER TABLE `PlanItem`
  CHANGE `content` `contentPath` VARCHAR(500) NOT NULL DEFAULT '';

-- ExamQuestion: add contentPath, drop question + explain
ALTER TABLE `ExamQuestion`
  ADD COLUMN `contentPath` VARCHAR(500) NOT NULL DEFAULT '';

ALTER TABLE `ExamQuestion`
  DROP COLUMN `question`,
  DROP COLUMN `explain`;

-- Progress: rename evaluation -> evaluationPath (TEXT NULL -> VARCHAR(500) NULL)
ALTER TABLE `Progress`
  CHANGE `evaluation` `evaluationPath` VARCHAR(500) NULL DEFAULT NULL;
