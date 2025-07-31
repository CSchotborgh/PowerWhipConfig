import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeLookupFile() {
  try {
    const filePath = path.join(__dirname, '../attached_assets/MasterBubbleUpLookup_1753986672989.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return;
    }
    
    const workbook = XLSX.readFile(filePath);
    console.log('=== EXCEL FILE ANALYSIS ===');
    console.log('Sheet Names:', workbook.SheetNames);
    console.log('Total Sheets:', workbook.SheetNames.length);
    
    // Analyze each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n--- SHEET ${index + 1}: ${sheetName} ---`);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Rows: ${jsonData.length}`);
      
      if (jsonData.length > 0) {
        console.log('Columns:', Object.keys(jsonData[0]));
        console.log('Sample Data (first 2 rows):');
        jsonData.slice(0, 2).forEach((row, i) => {
          console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2));
        });
      }
    });
    
    // Focus on component-rich sheets
    const componentSheets = workbook.SheetNames.filter(name => 
      name.toLowerCase().includes('component') || 
      name.toLowerCase().includes('part') ||
      name.toLowerCase().includes('item') ||
      name.toLowerCase().includes('catalog')
    );
    
    if (componentSheets.length > 0) {
      console.log('\n=== COMPONENT SHEETS DETAILED ANALYSIS ===');
      componentSheets.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`\n${sheetName} - ${jsonData.length} components:`);
        
        // Analyze data structure
        if (jsonData.length > 0) {
          const sampleRow = jsonData[0];
          const keys = Object.keys(sampleRow);
          
          keys.forEach(key => {
            const values = jsonData.slice(0, 10).map(row => row[key]).filter(v => v !== undefined && v !== null && v !== '');
            if (values.length > 0) {
              console.log(`  ${key}: ${values.slice(0, 3).join(', ')}${values.length > 3 ? '...' : ''}`);
            }
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Error analyzing file:', error.message);
  }
}

analyzeLookupFile();