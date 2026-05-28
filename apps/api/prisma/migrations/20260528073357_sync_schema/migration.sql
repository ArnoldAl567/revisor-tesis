/*
  Warnings:

  - You are about to alter the column `status` on the `Advance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ThesisTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `AIAnalysis` DROP FOREIGN KEY `AIAnalysis_advanceId_fkey`;

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_advanceId_fkey`;

-- AlterTable
ALTER TABLE `AIAnalysis` ADD COLUMN `aiModel` VARCHAR(191) NULL,
    ADD COLUMN `aiProvider` VARCHAR(191) NULL,
    ADD COLUMN `missingSections` JSON NULL,
    ADD COLUMN `originalityScore` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `semanticNotes` TEXT NULL;

-- AlterTable
ALTER TABLE `Advance` ADD COLUMN `advanceGroupId` VARCHAR(191) NULL,
    ADD COLUMN `authorMeta` JSON NULL,
    ADD COLUMN `fileSizeBytes` INTEGER NULL,
    ADD COLUMN `fileType` VARCHAR(191) NOT NULL DEFAULT 'docx',
    ADD COLUMN `pageCount` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` ENUM('PENDING', 'AI_ANALYZING', 'AI_COMPLETE', 'IN_HUMAN_REVIEW', 'OBSERVED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Review` ADD COLUMN `checklist` JSON NULL,
    ADD COLUMN `findingDecisions` JSON NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `finalGrade` DOUBLE NULL,
    MODIFY `humanComment` TEXT NULL;

-- AlterTable
ALTER TABLE `ThesisTemplate` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `fileType` VARCHAR(191) NOT NULL DEFAULT 'docx',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `InstitutionConfig` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `maxGrade` DOUBLE NOT NULL DEFAULT 20,
    `gradeScale` VARCHAR(191) NOT NULL DEFAULT '0-20',
    `weights` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Annotation` (
    `id` VARCHAR(191) NOT NULL,
    `advanceId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `page` INTEGER NULL,
    `paragraph` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BulkJob` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `total` INTEGER NOT NULL DEFAULT 0,
    `processed` INTEGER NOT NULL DEFAULT 0,
    `failed` INTEGER NOT NULL DEFAULT 0,
    `programId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BulkJobItem` (
    `id` VARCHAR(191) NOT NULL,
    `bulkJobId` VARCHAR(191) NOT NULL,
    `advanceId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `error` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `userId` VARCHAR(191) NULL,
    `advanceId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'info',
    `read` BOOLEAN NOT NULL DEFAULT false,
    `advanceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_read_idx`(`userId`, `read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Advance_advanceGroupId_idx` ON `Advance`(`advanceGroupId`);

-- CreateIndex
CREATE INDEX `Advance_status_idx` ON `Advance`(`status`);

-- AddForeignKey
ALTER TABLE `AIAnalysis` ADD CONSTRAINT `AIAnalysis_advanceId_fkey` FOREIGN KEY (`advanceId`) REFERENCES `Advance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_advanceId_fkey` FOREIGN KEY (`advanceId`) REFERENCES `Advance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Annotation` ADD CONSTRAINT `Annotation_advanceId_fkey` FOREIGN KEY (`advanceId`) REFERENCES `Advance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Annotation` ADD CONSTRAINT `Annotation_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BulkJob` ADD CONSTRAINT `BulkJob_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BulkJobItem` ADD CONSTRAINT `BulkJobItem_bulkJobId_fkey` FOREIGN KEY (`bulkJobId`) REFERENCES `BulkJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BulkJobItem` ADD CONSTRAINT `BulkJobItem_advanceId_fkey` FOREIGN KEY (`advanceId`) REFERENCES `Advance`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Advance` RENAME INDEX `Advance_programId_fkey` TO `Advance_programId_idx`;
