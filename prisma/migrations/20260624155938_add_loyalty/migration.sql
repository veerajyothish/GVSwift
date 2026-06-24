-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralUse" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "referredUserId" UUID NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLedger" (
    "id" TEXT NOT NULL,
    "loyaltyAccountId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltySettings" (
    "id" TEXT NOT NULL,
    "pointsPerRupee" INTEGER NOT NULL DEFAULT 1,
    "rupeesPer100Points" INTEGER NOT NULL DEFAULT 10,
    "referralBonus" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");

-- CreateIndex
CREATE INDEX "ReferralCode_userId_idx" ON "ReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralUse_referredUserId_key" ON "ReferralUse"("referredUserId");

-- CreateIndex
CREATE INDEX "ReferralUse_referralCodeId_idx" ON "ReferralUse"("referralCodeId");

-- CreateIndex
CREATE INDEX "ReferralUse_referredUserId_idx" ON "ReferralUse"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyAccount_userId_idx" ON "LoyaltyAccount"("userId");

-- CreateIndex
CREATE INDEX "PointsLedger_loyaltyAccountId_idx" ON "PointsLedger"("loyaltyAccountId");

-- CreateIndex
CREATE INDEX "PointsLedger_orderId_idx" ON "PointsLedger"("orderId");
