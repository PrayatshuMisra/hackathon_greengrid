import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import pdfParse from "pdf-parse";
import { promisify } from "util";
import sizeOf from "image-size";

type SupportedFileTypes = "csv" | "pdf" | "png";

export async function rule5ValidateExportedFile(
  filePath: string,
  type: SupportedFileTypes
): Promise<{ success: boolean; message: string }> {
  if (!fs.existsSync(filePath)) {
    return { success: false, message: `File not found: ${filePath}` };
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileStats = fs.statSync(filePath);

  if (fileStats.size < 10) {
    return { success: false, message: `File is too small or empty: ${filePath}` };
  }

  if ((type === "csv" && ext !== ".csv") || (type === "pdf" && ext !== ".pdf") || (type === "png" && ext !== ".png")) {
    return { success: false, message: `File extension does not match the expected type (${type})` };
  }

  try {
    if (type === "csv") {
      await validateCSV(filePath);
    } else if (type === "pdf") {
      await validatePDF(filePath);
    } else if (type === "png") {
      await validatePNG(filePath);
    }

    return { success: true, message: `File is valid (${type})` };
  } catch (err: any) {
    return { success: false, message: `Validation failed: ${err.message}` };
  }
}

async function validateCSV(filePath: string): Promise<void> {
  const requiredHeaders = ["Rank", "Name", "Points"];
  const rows: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => rows.push(data))
      .on("end", () => {
        const headers = Object.keys(rows[0] || {});
        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          reject(new Error(`Missing headers: ${missing.join(", ")}`));
        } else {
          resolve();
        }
      })
      .on("error", reject);
  });
}

async function validatePDF(filePath: string): Promise<void> {
  const fileBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(fileBuffer);
  if (!data.text.includes("GreenGrid") || !data.text.includes("Certificate")) {
    throw new Error("Expected keywords not found in PDF content");
  }
}

async function validatePNG(filePath: string): Promise<void> {
  const buffer = fs.readFileSync(filePath);
const dimensions = sizeOf(buffer);

  if (!dimensions || dimensions.width < 100 || dimensions.height < 100) {
    throw new Error("Image resolution too low or unreadable");
  }
}
