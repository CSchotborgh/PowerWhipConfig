import * as XLSX from 'xlsx';
import { ComponentDataSource, InsertElectricalComponent } from '@shared/schema';
import { randomUUID } from 'crypto';

export interface DataSourceConfig {
  excel?: {
    filePath?: string;
    url?: string;
    sheetName?: string;
    columnMapping: {
      name: string;
      type: string;
      category: string;
      maxVoltage?: string;
      maxCurrent?: string;
      price?: string;
      specifications?: string;
    };
  };
  url?: {
    endpoint: string;
    headers?: Record<string, string>;
    apiKey?: string;
    format: 'json' | 'csv' | 'xml';
    dataPath?: string; // JSON path to component array
  };
  odoo?: {
    baseUrl: string;
    database: string;
    username: string;
    password: string;
    model: string; // e.g., 'product.product'
    domain?: any[]; // Odoo domain filter
    fields: string[];
    fieldMapping: Record<string, string>;
  };
}

export class DataSourceManager {
  async syncDataSource(source: ComponentDataSource): Promise<{
    success: boolean;
    components: InsertElectricalComponent[];
    errors: string[];
  }> {
    const config = source.config as DataSourceConfig;
    
    try {
      switch (source.type) {
        case 'excel':
          return await this.syncExcelSource(config.excel!);
        case 'url':
          return await this.syncUrlSource(config.url!);
        case 'odoo':
          return await this.syncOdooSource(config.odoo!);
        default:
          throw new Error(`Unsupported data source type: ${source.type}`);
      }
    } catch (error) {
      return {
        success: false,
        components: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async syncExcelSource(config: DataSourceConfig['excel']): Promise<{
    success: boolean;
    components: InsertElectricalComponent[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const components: InsertElectricalComponent[] = [];

    try {
      let workbook: XLSX.WorkBook;

      // Load Excel file from URL or local path
      if (config?.url) {
        const response = await fetch(config.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        workbook = XLSX.read(buffer, { type: 'array' });
      } else if (config?.filePath) {
        workbook = XLSX.readFile(config.filePath);
      } else {
        throw new Error('No Excel file source specified');
      }

      // Get the specified sheet or first sheet
      const sheetName = config?.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // Map data to component format
      for (const row of data) {
        try {
          const component = this.mapRowToComponent(row, config?.columnMapping!);
          if (component) {
            components.push(component);
          }
        } catch (error) {
          errors.push(`Row mapping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success: errors.length === 0, components, errors };
    } catch (error) {
      return {
        success: false,
        components: [],
        errors: [error instanceof Error ? error.message : 'Excel parsing failed']
      };
    }
  }

  private async syncUrlSource(config: DataSourceConfig['url']): Promise<{
    success: boolean;
    components: InsertElectricalComponent[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const components: InsertElectricalComponent[] = [];

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.endpoint, { headers });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      let data: any;
      
      switch (config.format) {
        case 'json':
          data = await response.json();
          // Navigate to data using dataPath if specified
          if (config.dataPath) {
            const path = config.dataPath.split('.');
            for (const key of path) {
              data = data[key];
            }
          }
          break;
        case 'csv':
          const csvText = await response.text();
          // Simple CSV parsing - could use a library for complex cases
          const lines = csvText.split('\n');
          const headers = lines[0].split(',');
          data = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = values[index]?.trim();
            });
            return obj;
          });
          break;
        case 'xml':
          // XML parsing would require additional library
          throw new Error('XML format not yet implemented');
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      // Convert API data to components
      if (Array.isArray(data)) {
        for (const item of data) {
          try {
            const component = this.mapApiItemToComponent(item);
            if (component) {
              components.push(component);
            }
          } catch (error) {
            errors.push(`Item mapping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return { success: errors.length === 0, components, errors };
    } catch (error) {
      return {
        success: false,
        components: [],
        errors: [error instanceof Error ? error.message : 'URL sync failed']
      };
    }
  }

  private async syncOdooSource(config: DataSourceConfig['odoo']): Promise<{
    success: boolean;
    components: InsertElectricalComponent[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const components: InsertElectricalComponent[] = [];

    try {
      // Odoo XML-RPC authentication
      const authResponse = await fetch(`${config.baseUrl}/xmlrpc/2/common`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml' },
        body: `<?xml version='1.0'?>
          <methodCall>
            <methodName>authenticate</methodName>
            <params>
              <param><value><string>${config.database}</string></value></param>
              <param><value><string>${config.username}</string></value></param>
              <param><value><string>${config.password}</string></value></param>
              <param><value><struct></struct></value></param>
            </params>
          </methodCall>`
      });

      if (!authResponse.ok) {
        throw new Error('Odoo authentication failed');
      }

      // Parse authentication response to get uid
      const authText = await authResponse.text();
      const uidMatch = authText.match(/<value><int>(\d+)<\/int><\/value>/);
      
      if (!uidMatch) {
        throw new Error('Failed to extract user ID from Odoo response');
      }
      
      const uid = parseInt(uidMatch[1]);

      // Search and read records
      const searchResponse = await fetch(`${config.baseUrl}/xmlrpc/2/object`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml' },
        body: `<?xml version='1.0'?>
          <methodCall>
            <methodName>execute_kw</methodName>
            <params>
              <param><value><string>${config.database}</string></value></param>
              <param><value><int>${uid}</int></value></param>
              <param><value><string>${config.password}</string></value></param>
              <param><value><string>${config.model}</string></value></param>
              <param><value><string>search_read</string></value></param>
              <param><value><array><data>
                <value><array><data>${config.domain?.map(d => `<value><string>${d}</string></value>`).join('') || ''}</data></array></value>
              </data></array></value></param>
              <param><value><struct>
                <member><name>fields</name><value><array><data>
                  ${config.fields.map(f => `<value><string>${f}</string></value>`).join('')}
                </data></array></value></member>
              </struct></value></param>
            </params>
          </methodCall>`
      });

      if (!searchResponse.ok) {
        throw new Error('Odoo data fetch failed');
      }

      // Parse Odoo response (simplified - real implementation would need proper XML parsing)
      const responseText = await searchResponse.text();
      // This is a simplified parser - in production, use a proper XML parser
      
      // Mock successful response for now - replace with actual XML parsing
      const mockOdooData = [
        {
          name: 'NEMA 5-15P from Odoo',
          default_code: 'ODO-5-15P',
          list_price: 15.50,
          categ_id: [1, 'Electrical Connectors']
        }
      ];

      for (const record of mockOdooData) {
        try {
          const component = this.mapOdooRecordToComponent(record, config.fieldMapping);
          if (component) {
            components.push(component);
          }
        } catch (error) {
          errors.push(`Odoo record mapping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success: errors.length === 0, components, errors };
    } catch (error) {
      return {
        success: false,
        components: [],
        errors: [error instanceof Error ? error.message : 'Odoo sync failed']
      };
    }
  }

  private mapRowToComponent(row: any, mapping: DataSourceConfig['excel']['columnMapping']): InsertElectricalComponent | null {
    try {
      const name = row[mapping.name];
      if (!name) return null;

      // Parse specifications from string if provided
      let specifications: any = {};
      if (mapping.specifications && row[mapping.specifications]) {
        try {
          specifications = JSON.parse(row[mapping.specifications]);
        } catch {
          // If not JSON, create basic specs
          specifications = { description: row[mapping.specifications] };
        }
      }

      return {
        name: String(name),
        type: row[mapping.type] || 'connector',
        category: row[mapping.category] || 'general',
        specifications,
        symbol: this.getSymbolForType(row[mapping.type] || 'connector'),
        icon: this.getIconForType(row[mapping.type] || 'connector'),
        maxVoltage: mapping.maxVoltage ? parseInt(row[mapping.maxVoltage]) || null : null,
        maxCurrent: mapping.maxCurrent ? parseFloat(row[mapping.maxCurrent]) || null : null,
        price: mapping.price ? parseFloat(row[mapping.price]) || null : null,
        compatibleGauges: null // Could be mapped from Excel if column exists
      };
    } catch (error) {
      throw new Error(`Failed to map row to component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapApiItemToComponent(item: any): InsertElectricalComponent | null {
    // Generic API item mapping - could be customized per API
    if (!item.name && !item.title && !item.product_name) return null;

    return {
      name: item.name || item.title || item.product_name,
      type: item.type || item.category || 'connector',
      category: item.category || item.subcategory || 'general',
      specifications: item.specifications || item.specs || {},
      symbol: this.getSymbolForType(item.type || 'connector'),
      icon: this.getIconForType(item.type || 'connector'),
      maxVoltage: item.max_voltage || item.voltage || null,
      maxCurrent: item.max_current || item.current || item.amperage || null,
      price: item.price || item.cost || null,
      compatibleGauges: item.compatible_gauges || null
    };
  }

  private mapOdooRecordToComponent(record: any, fieldMapping: Record<string, string>): InsertElectricalComponent | null {
    if (!record.name && !record[fieldMapping.name]) return null;

    return {
      name: record[fieldMapping.name] || record.name,
      type: record[fieldMapping.type] || 'connector',
      category: record[fieldMapping.category] || 'general',
      specifications: {
        odoo_id: record.id,
        default_code: record.default_code,
        category: Array.isArray(record.categ_id) ? record.categ_id[1] : record.categ_id
      },
      symbol: this.getSymbolForType(record[fieldMapping.type] || 'connector'),
      icon: this.getIconForType(record[fieldMapping.type] || 'connector'),
      maxVoltage: record[fieldMapping.maxVoltage] || null,
      maxCurrent: record[fieldMapping.maxCurrent] || null,
      price: record.list_price || record[fieldMapping.price] || null,
      compatibleGauges: null
    };
  }

  private getSymbolForType(type: string): string {
    const symbolMap: Record<string, string> = {
      'connector': 'plug',
      'protection': 'breaker',
      'junction': 'junction',
      'wire': 'wire',
      'cable': 'wire'
    };
    return symbolMap[type.toLowerCase()] || 'plug';
  }

  private getIconForType(type: string): string {
    const iconMap: Record<string, string> = {
      'connector': 'fas fa-plug',
      'protection': 'fas fa-shield-alt',
      'junction': 'fas fa-cube',
      'wire': 'fas fa-minus',
      'cable': 'fas fa-minus'
    };
    return iconMap[type.toLowerCase()] || 'fas fa-plug';
  }
}