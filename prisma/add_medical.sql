CREATE TABLE IF NOT EXISTS `MedicalRecord` (
  `id`         VARCHAR(191) NOT NULL,
  `type`       VARCHAR(50)  NOT NULL,
  `title`      VARCHAR(300) NOT NULL,
  `recordDate` DATE         NOT NULL,
  `filePath`   VARCHAR(500) DEFAULT NULL,
  `fileExt`    VARCHAR(10)  DEFAULT NULL,
  `mimeType`   VARCHAR(100) DEFAULT NULL,
  `notes`      TEXT         DEFAULT NULL,
  `aiSummary`  LONGTEXT     DEFAULT NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `MedicalRecord_recordDate_idx` (`recordDate` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
