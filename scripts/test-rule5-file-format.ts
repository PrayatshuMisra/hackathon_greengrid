import path from "path";
import { rule5ValidateExportedFile } from "../lib/validation/rules/rule5-file-format";

async function runTests() {
  const testFiles = [
    { file: "public/sample-leaderboard.csv", type: "csv" as const },
    { file: "public/sample-certificate.pdf", type: "pdf" as const },
    { file: "public/sample-image.png", type: "png" as const },
  ];

  for (const { file, type } of testFiles) {
    const fullPath = path.resolve(file);
    console.log(`\nValidating ${type.toUpperCase()} file: ${file}`);
    const result = await rule5ValidateExportedFile(fullPath, type);
    console.log(result.message);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
});
