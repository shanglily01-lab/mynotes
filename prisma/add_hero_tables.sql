CREATE TABLE IF NOT EXISTS `HeroStory` (
  `id`        varchar(191) NOT NULL,
  `heroId`    varchar(100) NOT NULL,
  `storyType` varchar(50)  NOT NULL,
  `filePath`  varchar(500) DEFAULT NULL,
  `version`   int          NOT NULL DEFAULT 1,
  `updatedAt` datetime(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `HeroStory_heroId_storyType_key` (`heroId`, `storyType`),
  KEY `HeroStory_heroId_idx` (`heroId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HeroPortrait` (
  `id`         varchar(191) NOT NULL,
  `heroId`     varchar(100) NOT NULL,
  `styleIndex` int          NOT NULL,
  `filePath`   varchar(500) DEFAULT NULL,
  `version`    int          NOT NULL DEFAULT 1,
  `updatedAt`  datetime(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `HeroPortrait_heroId_styleIndex_key` (`heroId`, `styleIndex`),
  KEY `HeroPortrait_heroId_idx` (`heroId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
