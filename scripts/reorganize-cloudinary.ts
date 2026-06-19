import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// ─── Summary Tracker ───────────────────────────────────────────────────────────
const summary: {
    model: string;
    field: string;
    docId: string;
    status: 'success' | 'skipped' | 'failed';
    oldUrl: string;
    newUrl?: string;
    error?: string;
}[] = [];

// ─── Determine resource_type for Cloudinary rename ────────────────────────────
// 'image' for photos, 'raw' for PDFs/documents
function getResourceType(field: string): 'image' | 'raw' {
    const docFields = ['document', 'licenseDocumentUrl'];
    return docFields.includes(field) ? 'raw' : 'image';
}

// ─── Extract public_id from a Cloudinary URL ───────────────────────────────────
// URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
function extractPublicId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/');
        // Find the index after "upload"
        const uploadIndex = parts.findIndex(p => p === 'upload');
        if (uploadIndex === -1) return null;

        // Everything after 'upload' is version + public_id
        const afterUpload = parts.slice(uploadIndex + 1);

        // Remove the version segment (starts with 'v' followed by digits)
        const withoutVersion = afterUpload[0]?.match(/^v\d+$/)
            ? afterUpload.slice(1)
            : afterUpload;

        // Join and remove extension
        const fullPath = withoutVersion.join('/');
        const lastDot = fullPath.lastIndexOf('.');
        return lastDot !== -1 ? fullPath.substring(0, lastDot) : fullPath;
    } catch {
        return null;
    }
}

// ─── Determine target groovia folder from model + field ────────────────────────
function getTargetFolder(modelName: string, field: string): string {
    if (modelName === 'User') return 'groovia/users';
    if (modelName === 'Workshop') return 'groovia/workshops';
    if (modelName === 'Competition' && field === 'document') return 'groovia/competitions/documents';
    if (modelName === 'Competition') return 'groovia/competitions';
    if (modelName === 'UpgradeRequest') return 'groovia/upgrade-requests';
    return 'groovia/misc';
}

async function main() {
    console.log("==============================================");
    console.log("  Groovia: Reorganize Cloudinary Images      ");
    console.log("  Moving images into groovia/ folder         ");
    console.log("==============================================\n");

    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not found in .env");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME as string;
    cloudinary.config({
        cloud_name: cloudName,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log(`✅ Cloudinary configured (cloud: ${cloudName})\n`);

    // ─── Models ────────────────────────────────────────────────────────────────
    const User = mongoose.model('User', new mongoose.Schema({ profileImage: String }, { strict: false }));
    const Workshop = mongoose.model('Workshop', new mongoose.Schema({ posterImage: String }, { strict: false }));
    const Competition = mongoose.model('Competition', new mongoose.Schema({ posterImage: String, document: String }, { strict: false }));
    const UpgradeRequest = mongoose.model('UpgradeRequest', new mongoose.Schema({ licenseDocumentUrl: String }, { strict: false }));

    async function reorganizeModel(Model: any, fields: string[]) {
        console.log(`\n────────────────────────────────────────`);
        console.log(`  Reorganizing collection: ${Model.modelName}`);
        console.log(`────────────────────────────────────────`);

        const docs = await Model.find({});
        console.log(`  Found ${docs.length} documents.\n`);

        let movedCount = 0;
        let skippedCount = 0;

        for (const doc of docs) {
            let changed = false;

            for (const field of fields) {
                const url = doc[field];
                if (!url || typeof url !== 'string') continue;
                if (!url.includes('res.cloudinary.com')) continue;

                const currentPublicId = extractPublicId(url);
                if (!currentPublicId) {
                    console.log(`  ⚠️  Could not extract public_id from: ${url}`);
                    continue;
                }

                // Check if already in groovia/ folder
                if (currentPublicId.startsWith('groovia/')) {
                    skippedCount++;
                    console.log(`  ⏭️  [${doc._id}] [${field}] Already in groovia/ folder, skipping.`);
                    continue;
                }

                const targetFolder = getTargetFolder(Model.modelName, field);
                const fileName = currentPublicId.split('/').pop(); // keep original filename
                const newPublicId = `${targetFolder}/${fileName}`;

                console.log(`  🔄 Moving [${doc._id}] [${field}]`);
                console.log(`     From: ${currentPublicId}`);
                console.log(`     To:   ${newPublicId}`);

                try {
                    // Use Cloudinary rename to move the asset
                    const result = await cloudinary.uploader.rename(currentPublicId, newPublicId, {
                        overwrite: true,
                        resource_type: 'auto' as any,
                    });

                    const newUrl = result.secure_url;
                    doc[field] = newUrl;
                    changed = true;
                    movedCount++;

                    console.log(`     ✅ New URL: ${newUrl}`);
                    summary.push({
                        model: Model.modelName,
                        field,
                        docId: doc._id.toString(),
                        status: 'success',
                        oldUrl: url,
                        newUrl,
                    });
                } catch (err: any) {
                    console.error(`     ❌ Failed: ${err.message}`);
                    summary.push({
                        model: Model.modelName,
                        field,
                        docId: doc._id.toString(),
                        status: 'failed',
                        oldUrl: url,
                        error: err.message,
                    });
                }
            }

            if (changed) {
                await doc.save();
                console.log(`     💾 Saved to MongoDB.`);
            }
        }

        console.log(`\n  ${Model.modelName} done: ${movedCount} moved, ${skippedCount} already correct.`);
    }

    try {
        await reorganizeModel(User,          ['profileImage']);
        await reorganizeModel(Workshop,      ['posterImage']);
        await reorganizeModel(Competition,   ['posterImage', 'document']);
        await reorganizeModel(UpgradeRequest, ['licenseDocumentUrl']);

        // ─── Final Summary ─────────────────────────────────────────────────────
        console.log("\n\n==============================================");
        console.log("              REORGANIZATION SUMMARY         ");
        console.log("==============================================");

        const succeeded = summary.filter(s => s.status === 'success');
        const failed    = summary.filter(s => s.status === 'failed');

        console.log(`\n✅ Successfully moved: ${succeeded.length} files`);
        succeeded.forEach(s => {
            console.log(`   • [${s.model}] ${s.field} (doc: ${s.docId})`);
            console.log(`     ➜ ${s.newUrl}`);
        });

        if (failed.length > 0) {
            console.log(`\n❌ Failed: ${failed.length} files`);
            failed.forEach(s => {
                console.log(`   • [${s.model}] ${s.field} (doc: ${s.docId}): ${s.error}`);
            });
        } else {
            console.log(`\n🎉 All done! No failures.`);
        }

        console.log(`\n📁 Your Cloudinary folder structure:`);
        console.log(`   groovia/`);
        console.log(`   ├── users/`);
        console.log(`   ├── workshops/`);
        console.log(`   ├── competitions/`);
        console.log(`   │   └── documents/`);
        console.log(`   └── upgrade-requests/`);
        console.log("\n==============================================\n");

    } catch (err) {
        console.error("Reorganization error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB.");
    }
}

main();
