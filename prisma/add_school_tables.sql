CREATE TABLE IF NOT EXISTS `SchoolMaterial` (
  `id`           varchar(191) NOT NULL,
  `level`        varchar(20)  NOT NULL,
  `subject`      varchar(50)  NOT NULL,
  `basicPath`    varchar(500) DEFAULT NULL,
  `advancedPath` varchar(500) DEFAULT NULL,
  `updatedAt`    datetime(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SchoolMaterial_level_subject_key` (`level`, `subject`),
  KEY `SchoolMaterial_level_idx` (`level`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SchoolWrongAnswer` (
  `id`           varchar(191) NOT NULL,
  `level`        varchar(20)  NOT NULL,
  `subject`      varchar(50)  NOT NULL,
  `imagePath`    varchar(500) DEFAULT NULL,
  `mimeType`     varchar(100) DEFAULT NULL,
  `analysisJson` longtext     DEFAULT NULL,
  `createdAt`    datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `SchoolWrongAnswer_level_subject_idx` (`level`, `subject`),
  KEY `SchoolWrongAnswer_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
