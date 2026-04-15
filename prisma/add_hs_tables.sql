CREATE TABLE IF NOT EXISTS `HSMaterial` (
  `id`          VARCHAR(191) NOT NULL,
  `subject`     VARCHAR(191) NOT NULL,
  `contentPath` VARCHAR(500) DEFAULT NULL,
  `updatedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `HSMaterial_subject_key`(`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HSWrongAnswer` (
  `id`           VARCHAR(191) NOT NULL,
  `subject`      VARCHAR(191) NOT NULL,
  `imagePath`    VARCHAR(500) DEFAULT NULL,
  `mimeType`     VARCHAR(100) DEFAULT NULL,
  `analysisJson` LONGTEXT     DEFAULT NULL,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HSWrongAnswer_subject_idx`(`subject`),
  INDEX `HSWrongAnswer_createdAt_idx`(`createdAt` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
