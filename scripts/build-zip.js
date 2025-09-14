import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createZip() {
  const assetsDir = path.join(__dirname, '..', 'attached_assets');
  const outputDir = path.join(__dirname, '..', 'dist', 'public');
  const zipPath = path.join(outputDir, 'Technical_Specifications_Complete.zip');

  // Ensure output directory exists
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Get all PDF files
  const files = await fs.promises.readdir(assetsDir);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.log('No PDF files found to zip');
    return;
  }

  console.log(`Creating ZIP with ${pdfFiles.length} PDF files...`);

  // Create ZIP archive
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all PDF files to the archive
    for (const pdfFile of pdfFiles) {
      const filePath = path.join(assetsDir, pdfFile);
      if (fs.existsSync(filePath)) {
        // Clean up filename for better organization in ZIP
        const cleanName = pdfFile.replace(/_\d{13}/g, ''); // Remove timestamps
        archive.file(filePath, { name: cleanName });
      }
    }

    archive.finalize();
  });
}

createZip().catch(console.error);