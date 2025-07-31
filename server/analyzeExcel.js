import XLSX from 'node-xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../attached_assets/MasterBubbleUpLookup_1753982166714.xlsx');

try {
  const workbook = XLSX.parse(fs.readFileSync(filePath));
  
  console.log('=== EXCEL FILE ANALYSIS ===');
  console.log(`Total sheets: ${workbook.length}`);
  
  workbook.forEach((sheet, index) => {
    console.log(`\n--- Sheet ${index + 1}: "${sheet.name}" ---`);
    console.log(`Rows: ${sheet.data.length}`);
    
    if (sheet.data && sheet.data.length > 0) {
      console.log('Headers (first row):');
      console.log(JSON.stringify(sheet.data[0], null, 2));
      
      if (sheet.data.length > 1) {
        console.log('\nSample data (second row):');
        console.log(JSON.stringify(sheet.data[1], null, 2));
      }
      
      if (sheet.data.length > 2) {
        console.log('\nFirst 3 data rows:');
        sheet.data.slice(0, 3).forEach((row, i) => {
          console.log(`Row ${i + 1}:`, JSON.stringify(row?.slice(0, 10), null, 2)); // First 10 columns
        });
      }
    }
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}