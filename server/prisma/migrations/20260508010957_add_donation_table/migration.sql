-- CreateTable
CREATE TABLE "donation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "donor_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "stripe_session_id" VARCHAR(512) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donation_stripe_session_id_key" ON "donation"("stripe_session_id");

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
