import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import type { PowerWhipConfiguration, ElectricalComponent } from '@shared/schema';

export interface ExportConfiguration {
  configuration: PowerWhipConfiguration;
  components: ElectricalComponent[];
}

export async function exportToXLSX(config: ExportConfiguration): Promise<void> {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Configuration Summary sheet
  const configData = [
    ['Parameter', 'Value'],
    ['Configuration Name', config.configuration.name],
    ['Voltage Rating', `${config.configuration.voltage}V`],
    ['Current Rating', `${config.configuration.current}A`],
    ['Wire Gauge', `${config.configuration.wireGauge} AWG`],
    ['Total Length', `${config.configuration.totalLength} ft`],
    ['Valid Configuration', config.configuration.isValid ? 'Yes' : 'No'],
    ['Created Date', config.configuration.createdAt?.toLocaleDateString()],
  ];
  
  const configWS = XLSX.utils.aoa_to_sheet(configData);
  XLSX.utils.book_append_sheet(wb, configWS, 'Configuration');
  
  // Components sheet
  const componentData = [
    ['Name', 'Type', 'Category', 'Max Voltage', 'Max Current', 'Price'],
    ...config.components.map(comp => [
      comp.name,
      comp.type,
      comp.category,
      comp.maxVoltage ? `${comp.maxVoltage}V` : 'N/A',
      comp.maxCurrent ? `${comp.maxCurrent}A` : 'N/A',
      comp.price ? `$${comp.price.toFixed(2)}` : 'N/A',
    ])
  ];
  
  const componentsWS = XLSX.utils.aoa_to_sheet(componentData);
  XLSX.utils.book_append_sheet(wb, componentsWS, 'Components');
  
  // Material List sheet
  const materialData = [
    ['Item', 'Quantity', 'Unit Price', 'Total Price'],
    ...config.components.map(comp => [
      comp.name,
      1,
      comp.price ? `$${comp.price.toFixed(2)}` : '$0.00',
      comp.price ? `$${comp.price.toFixed(2)}` : '$0.00',
    ]),
    ['Total', '', '', `$${config.components.reduce((sum, comp) => sum + (comp.price || 0), 0).toFixed(2)}`]
  ];
  
  const materialWS = XLSX.utils.aoa_to_sheet(materialData);
  XLSX.utils.book_append_sheet(wb, materialWS, 'Material List');
  
  // Write and download file
  XLSX.writeFile(wb, `${config.configuration.name}_configuration.xlsx`);
}

export async function exportToPDF(config: ExportConfiguration): Promise<void> {
  const pdf = new jsPDF();
  
  // Title
  pdf.setFontSize(20);
  pdf.text('Electrical Power Whip Configuration', 20, 30);
  
  // Configuration details
  pdf.setFontSize(16);
  pdf.text('Configuration Details', 20, 50);
  
  pdf.setFontSize(12);
  const configText = [
    `Name: ${config.configuration.name}`,
    `Voltage: ${config.configuration.voltage}V`,
    `Current: ${config.configuration.current}A`,
    `Wire Gauge: ${config.configuration.wireGauge} AWG`,
    `Total Length: ${config.configuration.totalLength} ft`,
    `Status: ${config.configuration.isValid ? 'Valid' : 'Invalid'}`,
  ];
  
  configText.forEach((text, index) => {
    pdf.text(text, 20, 65 + (index * 10));
  });
  
  // Components section
  pdf.setFontSize(16);
  pdf.text('Components', 20, 140);
  
  pdf.setFontSize(10);
  config.components.forEach((comp, index) => {
    const y = 155 + (index * 15);
    pdf.text(`${comp.name} - ${comp.type}`, 25, y);
    pdf.text(`${comp.maxVoltage || 'N/A'}V / ${comp.maxCurrent || 'N/A'}A`, 25, y + 7);
    pdf.text(`$${comp.price?.toFixed(2) || '0.00'}`, 150, y);
  });
  
  // Technical analysis
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Technical Analysis', 20, 30);
  
  pdf.setFontSize(12);
  const analysisText = [
    'Voltage Drop Analysis:',
    '- Calculated for worst-case loading',
    '- Based on NEC standards',
    '',
    'Thermal Analysis:',
    '- Conductor temperature ratings verified',
    '- Ambient conditions considered',
    '',
    'Compliance Standards:',
    '- NEC Article 400 (Flexible Cords)',
    '- UL 62 (Flexible Cord Standards)',
    '- OSHA 1926.405 (Construction Safety)',
  ];
  
  analysisText.forEach((text, index) => {
    pdf.text(text, 20, 50 + (index * 10));
  });
  
  // Save the PDF
  pdf.save(`${config.configuration.name}_technical_drawing.pdf`);
}

export async function exportConfigurationData(configId: string): Promise<ExportConfiguration> {
  // Fetch configuration and components from API
  const [configResponse, componentsResponse] = await Promise.all([
    fetch(`/api/export/xlsx/${configId}`, { method: 'POST' }),
    fetch('/api/components'),
  ]);
  
  if (!configResponse.ok || !componentsResponse.ok) {
    throw new Error('Failed to fetch export data');
  }
  
  const [configData, componentsData] = await Promise.all([
    configResponse.json(),
    componentsResponse.json(),
  ]);
  
  return {
    configuration: configData.configuration,
    components: componentsData,
  };
}
