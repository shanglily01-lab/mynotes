-- DropForeignKey
ALTER TABLE `Article` DROP FOREIGN KEY `Article_subjectId_fkey`;

-- DropIndex
DROP INDEX `Article_subjectId_publishedAt_idx` ON `Article`;

-- CreateIndex
CREATE INDEX `Article_subjectId_publishedAt_idx` ON `Article`(`subjectId`, `publishedAt` DESC);

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
