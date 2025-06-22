-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "start_date" DATETIME,
    "target_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "model" TEXT,
    "system_prompt" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    CONSTRAINT "chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chats_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT,
    "role" TEXT NOT NULL,
    "parts" TEXT,
    "experimental_attachments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT,
    CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT,
    "file_type" TEXT,
    "file_size" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "chat_attachments_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "display_name" TEXT,
    "profile_image" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "message_count" INTEGER DEFAULT 0,
    "daily_message_count" INTEGER DEFAULT 0,
    "daily_reset" DATETIME,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" DATETIME,
    "daily_pro_message_count" INTEGER DEFAULT 0,
    "daily_pro_reset" DATETIME,
    "system_prompt" TEXT,
    "preferred_model" TEXT
);
INSERT INTO "new_user" ("anonymous", "createdAt", "display_name", "email", "emailVerified", "id", "image", "name", "profile_image", "updatedAt") SELECT "anonymous", "createdAt", "display_name", "email", "emailVerified", "id", "image", "name", "profile_image", "updatedAt" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
