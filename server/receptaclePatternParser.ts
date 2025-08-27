/**
 * Natural Language Receptacle Pattern Parser
 * Converts user input like "460R9W, Metal Conduit, 50ft, Pigtail 10" into standardized PreSal format
 */

export interface ParsedReceptaclePattern {
  receptacleType: string;
  conduitType: string;
  whipLength: number;
  tailLength: number;
  voltage: string;
  current: string;
  wireGauge: string;
  specifications: string;
  confidence: number;
}

export class ReceptaclePatternParser {
  
  // Receptacle type mappings and specifications
  private receptacleDatabase = {
    // NEMA straight blade receptacles
    '460R9W': { standard: '5-15R', voltage: '125V', current: '15A', wireGauge: '14', specs: 'NEMA 5-15R, 15A, 125V, White' },
    '5-15R': { standard: '5-15R', voltage: '125V', current: '15A', wireGauge: '14', specs: 'NEMA 5-15R, 15A, 125V' },
    '5-20R': { standard: '5-20R', voltage: '125V', current: '20A', wireGauge: '12', specs: 'NEMA 5-20R, 20A, 125V' },
    
    // NEMA locking receptacles
    'L5-15R': { standard: 'L5-15R', voltage: '125V', current: '15A', wireGauge: '14', specs: 'NEMA L5-15R, 15A, 125V Locking' },
    'L5-20R': { standard: 'L5-20R', voltage: '125V', current: '20A', wireGauge: '12', specs: 'NEMA L5-20R, 20A, 125V Locking' },
    'L6-15R': { standard: 'L6-15R', voltage: '250V', current: '15A', wireGauge: '14', specs: 'NEMA L6-15R, 15A, 250V Locking' },
    'L6-20R': { standard: 'L6-20R', voltage: '250V', current: '20A', wireGauge: '12', specs: 'NEMA L6-20R, 20A, 250V Locking' },
    'L6-30R': { standard: 'L6-30R', voltage: '250V', current: '30A', wireGauge: '10', specs: 'NEMA L6-30R, 30A, 250V Locking' },
    
    // California Standard receptacles
    'CS8269A': { standard: 'CS8269A', voltage: '480V', current: '50A', wireGauge: '6', specs: 'California Standard CS8269A, 50A, 480V' },
    'CS8365A': { standard: 'CS8365A', voltage: '480V', current: '60A', wireGauge: '4', specs: 'California Standard CS8365A, 60A, 480V' },
    
    // IEC receptacles
    'IEC60309': { standard: 'IEC60309', voltage: '400V', current: '32A', wireGauge: '8', specs: 'IEC 60309, 32A, 400V Industrial' },
  };

  // Conduit type standardization
  private conduitMappings = {
    'metal conduit': 'EMT',
    'emt': 'EMT',
    'electrical metallic tubing': 'EMT',
    'fmc': 'FMC',
    'flexible metal conduit': 'FMC',
    'flexible metallic conduit': 'FMC',
    'lfmc': 'LFMC',
    'liquid tight flexible metal conduit': 'LFMC',
    'liquidtight flexible metal conduit': 'LFMC',
    'liquid-tight flexible metal conduit': 'LFMC',
    'lmzc': 'LMZC',
    'liquidtight flexible nonmetallic conduit': 'LMZC',
    'mc': 'MC',
    'metal-clad cable': 'MC',
    'armored cable': 'MC'
  };

  // Length extraction patterns
  private lengthPatterns = [
    { pattern: /(\d+)\s*(?:ft|feet|foot)/i, type: 'whip' },
    { pattern: /(\d+)\s*(?:ft\.?|feet|foot)/i, type: 'whip' },
    { pattern: /(\d+\.?\d*)\s*(?:ft|feet|foot)/i, type: 'whip' }
  ];

  // Tail/pigtail length extraction
  private tailPatterns = [
    { pattern: /(?:pigtail|pig tail|tail length|tail whip|whip tail)\s*(\d+)/i, type: 'tail' },
    { pattern: /(?:tail|pigtail)\s*(\d+)/i, type: 'tail' }
  ];

  /**
   * Parse a natural language receptacle pattern
   */
  public parsePattern(input: string): ParsedReceptaclePattern | null {
    try {
      const parts = input.split(',').map(part => part.trim());
      
      if (parts.length < 3) {
        console.warn('Insufficient pattern parts:', input);
        return null;
      }

      // Extract receptacle type (first part)
      const receptacleInput = parts[0].toUpperCase();
      const receptacleInfo = this.findReceptacleType(receptacleInput);
      
      if (!receptacleInfo) {
        console.warn('Unknown receptacle type:', receptacleInput);
        return null;
      }

      // Extract conduit type (second part)
      const conduitInput = parts[1].toLowerCase().trim();
      const conduitType = this.standardizeConduitType(conduitInput);

      // Extract whip length (third part)
      const whipLength = this.extractLength(parts[2], 'whip');

      // Extract tail length (fourth part or from other parts)
      let tailLength = 0;
      if (parts.length > 3) {
        tailLength = this.extractLength(parts[3], 'tail');
      }
      
      // If no tail length found, search in all parts
      if (tailLength === 0) {
        for (const part of parts) {
          const foundTail = this.extractTailLength(part);
          if (foundTail > 0) {
            tailLength = foundTail;
            break;
          }
        }
      }

      const parsed: ParsedReceptaclePattern = {
        receptacleType: receptacleInfo.standard,
        conduitType: conduitType,
        whipLength: whipLength,
        tailLength: tailLength || 10, // Default to 10ft if not specified
        voltage: receptacleInfo.voltage,
        current: receptacleInfo.current,
        wireGauge: receptacleInfo.wireGauge,
        specifications: receptacleInfo.specs,
        confidence: this.calculateConfidence(input, receptacleInfo.standard, conduitType, whipLength, tailLength)
      };

      return parsed;
    } catch (error) {
      console.error('Pattern parsing error:', error);
      return null;
    }
  }

  /**
   * Find receptacle type from input
   */
  private findReceptacleType(input: string): any {
    const upperInput = input.toUpperCase();
    
    // Direct match
    if (this.receptacleDatabase[upperInput]) {
      return this.receptacleDatabase[upperInput];
    }

    // Partial matches and variations
    for (const [key, value] of Object.entries(this.receptacleDatabase)) {
      if (upperInput.includes(key) || key.includes(upperInput)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Standardize conduit type
   */
  private standardizeConduitType(input: string): string {
    const lowerInput = input.toLowerCase().trim();
    
    for (const [pattern, standard] of Object.entries(this.conduitMappings)) {
      if (lowerInput.includes(pattern) || pattern.includes(lowerInput)) {
        return standard;
      }
    }

    // Return original if no match found
    return input.toUpperCase();
  }

  /**
   * Extract length from text
   */
  private extractLength(text: string, type: 'whip' | 'tail'): number {
    const patterns = type === 'whip' ? this.lengthPatterns : this.tailPatterns;
    
    for (const { pattern } of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    // Try basic number extraction
    const numberMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      return parseFloat(numberMatch[1]);
    }

    return 0;
  }

  /**
   * Extract tail length specifically
   */
  private extractTailLength(text: string): number {
    for (const { pattern } of this.tailPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    return 0;
  }

  /**
   * Calculate parsing confidence
   */
  private calculateConfidence(
    input: string, 
    receptacle: string, 
    conduit: string, 
    whipLength: number, 
    tailLength: number
  ): number {
    let confidence = 0.5; // Base confidence

    // Receptacle type found
    if (receptacle && receptacle !== input.split(',')[0]) {
      confidence += 0.3;
    }

    // Conduit type standardized
    if (conduit && conduit.length > 0) {
      confidence += 0.15;
    }

    // Whip length extracted
    if (whipLength > 0) {
      confidence += 0.15;
    }

    // Tail length extracted
    if (tailLength > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Parse multiple patterns from text input
   */
  public parseMultiplePatterns(input: string): ParsedReceptaclePattern[] {
    const lines = input.split('\n').filter(line => line.trim().length > 0);
    const results: ParsedReceptaclePattern[] = [];

    for (const line of lines) {
      const parsed = this.parsePattern(line.trim());
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  /**
   * Convert parsed patterns to PreSal format
   */
  public convertToPreSal(patterns: ParsedReceptaclePattern[]): any[][] {
    const preSalData = [
      // Header row
      [
        'Row ID', 'Receptacle Type', 'Cable/Conduit Type', 'Whip Length (ft)', 
        'Tail Length (ft)', 'Voltage (V)', 'Current (A)', 'Wire Gauge (AWG)',
        'Label Color', 'Installation Notes', 'NEC Compliance', 'Part Number',
        'Manufacturer', 'Cost', 'Lead Time', 'Specifications',
        'Parse Confidence', 'Original Input'
      ]
    ];

    patterns.forEach((pattern, index) => {
      preSalData.push([
        `PWC-${(index + 1).toString().padStart(3, '0')}`,
        pattern.receptacleType,
        pattern.conduitType,
        pattern.whipLength.toString(),
        pattern.tailLength.toString(),
        pattern.voltage,
        pattern.current,
        pattern.wireGauge,
        'Blue', // Default color
        `${pattern.receptacleType} with ${pattern.conduitType} conduit`,
        'NEC 2020 Article 400 Compliant',
        `PN-${pattern.receptacleType}-${index + 1}`,
        'PowerWhip Industries',
        `$${(125 + index * 10).toFixed(2)}`,
        '2-3 weeks',
        pattern.specifications,
        `${Math.round(pattern.confidence * 100)}%`,
        `${pattern.receptacleType}, ${pattern.conduitType}, ${pattern.whipLength}ft, Tail ${pattern.tailLength}ft`
      ]);
    });

    return preSalData;
  }
}

export default ReceptaclePatternParser;