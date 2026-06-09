import mongoose from 'mongoose';
import * as AWS from 'aws-sdk';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// ─── Summary Tracker ───────────────────────────────────────────────────────────
const summary: {
    model: string;
    field: string;
    docId: string;
    status: 'success' | 'failed';
    oldUrl: string;
    newUrl?: string;
    error?: string;
}[] = [];

async function main() {
    console.log("==============================================");
    console.log("  Groovia: S3 → Cloudinary Migration Script  ");
    console.log("==============================================\n");

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not found in .env");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Setup AWS S3
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
    const bucketName = process.env.AWS_S3_BUCKET_NAME as string;
    if (!bucketName) throw new Error("AWS_S3_BUCKET_NAME not found in .env");

    // Setup Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log(`✅ Cloudinary configured (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})\n`);

    // ─── Models (strict:false to avoid breaking existing schemas) ──────────────
    const User = mongoose.model('User', new mongoose.Schema({ profileImage: String }, { strict: false }));
    const Workshop = mongoose.model('Workshop', new mongoose.Schema({ posterImage: String }, { strict: false }));
    const Competition = mongoose.model('Competition', new mongoose.Schema({ posterImage: String, document: String }, { strict: false }));
    const UpgradeRequest = mongoose.model('UpgradeRequest', new mongoose.Schema({ licenseDocumentUrl: String }, { strict: false }));

    // ─── Download from S3 ──────────────────────────────────────────────────────
    async function getS3Buffer(url: string) {
        // Strip existing query params (expired signatures) before downloading
        const baseUrl = url.split('?')[0];
        const urlObj = new URL(baseUrl);
        const key = decodeURIComponent(urlObj.pathname.substring(1));
        console.log(`   📥 Downloading from S3: ${key}`);
        const result = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
        return { buffer: result.Body as Buffer, key };
    }

    // ─── Upload to Cloudinary under groovia/ folder ────────────────────────────
    async function uploadToCloudinary(buffer: Buffer, originalKey: string, folder: string) {
        return new Promise<string>((resolve, reject) => {
            // Remove extension from key for public_id (Cloudinary adds it automatically)
            const lastDotIndex = originalKey.lastIndexOf('.');
            const fileNameWithoutExt = lastDotIndex !== -1 ? originalKey.substring(0, lastDotIndex) : originalKey;

            // Place inside groovia/<subfolder>/<filename>
            const public_id = `groovia/${folder}/${fileNameWithoutExt.split('/').pop()}`;

            console.log(`   📤 Uploading to Cloudinary as: ${public_id}`);

            const uploadStream = cloudinary.uploader.upload_stream(
                { public_id, resource_type: 'auto', overwrite: true },
                (error, result) => {
                    if (error) reject(error);
                    else {
                        console.log(`   ✅ Cloudinary URL: ${result!.secure_url}`);
                        resolve(result!.secure_url);
                    }
                }
            );
            uploadStream.end(buffer);
        });
    }

    // ─── Migrate a model's fields ──────────────────────────────────────────────
    async function migrateModel(Model: any, fields: { fieldName: string; cloudinaryFolder: string }[]) {
        console.log(`\n────────────────────────────────────────`);
        console.log(`  Migrating collection: ${Model.modelName}`);
        console.log(`────────────────────────────────────────`);

        const docs = await Model.find({});
        console.log(`  Found ${docs.length} documents to check.\n`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const doc of docs) {
            let changed = false;
            for (const { fieldName, cloudinaryFolder } of fields) {
                const url = doc[fieldName];

                // Skip if already on Cloudinary or empty
                if (!url || typeof url !== 'string') continue;
                if (url.includes('res.cloudinary.com')) {
                    skippedCount++;
                    console.log(`  ⏭️  [${doc._id}] [${fieldName}] Already on Cloudinary, skipping.`);
                    continue;
                }
                if (!url.includes('amazonaws.com')) {
                    skippedCount++;
                    continue;
                }

                console.log(`\n  🔄 Migrating [${doc._id}] [${fieldName}]`);
                try {
                    const { buffer, key } = await getS3Buffer(url);
                    const cloudinaryUrl = await uploadToCloudinary(buffer, key, cloudinaryFolder);
                    doc[fieldName] = cloudinaryUrl;
                    changed = true;
                    migratedCount++;

                    summary.push({
                        model: Model.modelName,
                        field: fieldName,
                        docId: doc._id.toString(),
                        status: 'success',
                        oldUrl: url,
                        newUrl: cloudinaryUrl,
                    });
                } catch (err: any) {
                    console.error(`   ❌ Failed: ${err.message}`);
                    summary.push({
                        model: Model.modelName,
                        field: fieldName,
                        docId: doc._id.toString(),
                        status: 'failed',
                        oldUrl: url,
                        error: err.message,
                    });
                }
            }

            if (changed) {
                await doc.save();
                console.log(`   💾 Saved updated document to MongoDB.`);
            }
        }

        console.log(`\n  ${Model.modelName} done: ${migratedCount} migrated, ${skippedCount} already on Cloudinary.`);
    }

    // ─── Run Migration ─────────────────────────────────────────────────────────
    try {
        await migrateModel(User,         [{ fieldName: 'profileImage',      cloudinaryFolder: 'users' }]);
        await migrateModel(Workshop,     [{ fieldName: 'posterImage',        cloudinaryFolder: 'workshops' }]);
        await migrateModel(Competition,  [{ fieldName: 'posterImage',        cloudinaryFolder: 'competitions' },
                                          { fieldName: 'document',           cloudinaryFolder: 'competitions/documents' }]);
        await migrateModel(UpgradeRequest, [{ fieldName: 'licenseDocumentUrl', cloudinaryFolder: 'upgrade-requests' }]);

        // ─── Print Final Summary ───────────────────────────────────────────────
        console.log("\n\n==============================================");
        console.log("              MIGRATION SUMMARY              ");
        console.log("==============================================");

        const succeeded = summary.filter(s => s.status === 'success');
        const failed = summary.filter(s => s.status === 'failed');

        console.log(`\n✅ Successfully migrated: ${succeeded.length} files`);
        succeeded.forEach(s => {
            console.log(`   • [${s.model}] ${s.field} (doc: ${s.docId})`);
            console.log(`     New URL: ${s.newUrl}`);
        });

        if (failed.length > 0) {
            console.log(`\n❌ Failed: ${failed.length} files`);
            failed.forEach(s => {
                console.log(`   • [${s.model}] ${s.field} (doc: ${s.docId}): ${s.error}`);
            });
        } else {
            console.log(`\n🎉 All files migrated successfully! No failures.`);
        }

        console.log(`\n📁 All migrated files are inside the "groovia" folder in your Cloudinary dashboard.`);
        console.log(`   ├── groovia/users/`);
        console.log(`   ├── groovia/workshops/`);
        console.log(`   ├── groovia/competitions/`);
        console.log(`   └── groovia/upgrade-requests/`);
        console.log("\n==============================================\n");

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB.");
    }
}

main();
