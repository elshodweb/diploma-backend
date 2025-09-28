/*
  Warnings:

  - You are about to drop the column `userId` on the `Document` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_fkey";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "_InvitedUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ApprovedUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_InvitedUsers_AB_unique" ON "_InvitedUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_InvitedUsers_B_index" ON "_InvitedUsers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ApprovedUsers_AB_unique" ON "_ApprovedUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_ApprovedUsers_B_index" ON "_ApprovedUsers"("B");

-- AddForeignKey
ALTER TABLE "_InvitedUsers" ADD CONSTRAINT "_InvitedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvitedUsers" ADD CONSTRAINT "_InvitedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovedUsers" ADD CONSTRAINT "_ApprovedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovedUsers" ADD CONSTRAINT "_ApprovedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
