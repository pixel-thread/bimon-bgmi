import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_API_KEY as string;
const defaultBucket = process.env.SUPABASE_BUCKET_NAME as string;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSizes() {
    console.log(`\n🔍 Checking bucket: ${defaultBucket}\n`);

    // First try to list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
        console.error("Error listing buckets:", bucketsError.message);
    } else {
        console.log("Available buckets:", buckets?.map(b => b.name).join(", "));
    }

    // Try listing from both possible paths
    const pathsToTry = [
        { bucket: defaultBucket, path: "profile-images" },
        { bucket: `${defaultBucket}/profile-images`, path: "" },
    ];

    for (const { bucket, path } of pathsToTry) {
        console.log(`\nTrying bucket: "${bucket}", path: "${path}"`);

        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            console.log(`  ❌ Error: ${error.message}`);
            continue;
        }

        if (!data || data.length === 0) {
            console.log("  📭 No files found");
            continue;
        }

        console.log(`  ✅ Found ${data.length} items:`);

        let totalSize = 0;
        let fileCount = 0;

        for (const file of data) {
            // Skip folders (they have no metadata)
            if (!file.metadata?.size && file.id === null) {
                console.log(`    📁 [folder] ${file.name}`);
                continue;
            }

            const sizeKB = file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) : "unknown";
            const sizeMB = file.metadata?.size ? (file.metadata.size / (1024 * 1024)).toFixed(2) : "unknown";
            totalSize += file.metadata?.size || 0;
            fileCount++;

            console.log(`    📄 ${file.name.substring(0, 40).padEnd(40)} - ${sizeKB} KB (${sizeMB} MB)`);
        }

        if (fileCount > 0) {
            console.log(`\n  📊 Summary: ${fileCount} files, ${(totalSize / 1024).toFixed(1)} KB total`);
            console.log(`  📈 Average: ${((totalSize / 1024) / fileCount).toFixed(1)} KB per image`);
        }
    }
}

checkSizes();
