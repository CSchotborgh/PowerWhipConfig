export interface VoltageDropResult {
  drop: number;
  percentage: number;
  acceptable: boolean;
}

export interface ThermalAnalysisResult {
  ambientTemp: number;
  conductorTemp: number;
  safetyMargin: number;
  withinLimits: boolean;
}

export interface PowerConfiguration {
  voltage: number;
  current: number;
  wireGauge: string;
  totalLength?: number;
}

// Wire resistance values in ohms per 1000 feet at 20°C
const wireResistance: Record<string, number> = {
  "14": 2.525,
  "12": 1.588,
  "10": 0.999,
  "8": 0.628,
  "6": 0.395,
  "4": 0.248,
  "2": 0.156,
  "1": 0.123,
  "1/0": 0.098,
  "2/0": 0.078,
  "3/0": 0.062,
  "4/0": 0.049,
};

// Wire ampacity ratings at 30°C ambient
const wireAmpacity: Record<string, number> = {
  "14": 15,
  "12": 20,
  "10": 30,
  "8": 40,
  "6": 55,
  "4": 70,
  "2": 95,
  "1": 110,
  "1/0": 125,
  "2/0": 145,
  "3/0": 165,
  "4/0": 195,
};

export function calculateVoltageDrops(config: PowerConfiguration): VoltageDropResult {
  const length = config.totalLength || 12.5; // feet
  const resistance = wireResistance[config.wireGauge] || wireResistance["12"];
  
  // Calculate one-way resistance for the length
  const totalResistance = (resistance * length) / 1000;
  
  // Voltage drop = I × R × 2 (for round trip)
  const voltageDrop = config.current * totalResistance * 2;
  const percentage = (voltageDrop / config.voltage) * 100;
  
  return {
    drop: voltageDrop,
    percentage,
    acceptable: percentage < 3.0, // NEC recommends <3% for branch circuits
  };
}

export function calculateThermalAnalysis(config: PowerConfiguration): ThermalAnalysisResult {
  const ambientTemp = 25; // °C
  const maxAmpacity = wireAmpacity[config.wireGauge] || wireAmpacity["12"];
  
  // Temperature rise calculation based on current loading
  const loadingPercentage = config.current / maxAmpacity;
  const tempRise = Math.pow(loadingPercentage, 1.5) * 35; // Simplified thermal model
  
  const conductorTemp = ambientTemp + tempRise;
  const maxAllowableTemp = 90; // °C for THWN insulation
  const safetyMargin = maxAllowableTemp - conductorTemp;
  
  return {
    ambientTemp,
    conductorTemp: Math.round(conductorTemp),
    safetyMargin: Math.round(safetyMargin),
    withinLimits: conductorTemp < maxAllowableTemp,
  };
}

export function validateConfiguration(config: PowerConfiguration): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check wire gauge vs current rating
  const maxAmpacity = wireAmpacity[config.wireGauge];
  if (maxAmpacity && config.current > maxAmpacity) {
    errors.push(`Current rating (${config.current}A) exceeds wire ampacity (${maxAmpacity}A)`);
  }
  
  // Check voltage drop
  const voltageDrops = calculateVoltageDrops(config);
  if (voltageDrops.percentage > 5) {
    errors.push(`Voltage drop (${voltageDrops.percentage.toFixed(1)}%) exceeds 5% limit`);
  } else if (voltageDrops.percentage > 3) {
    warnings.push(`Voltage drop (${voltageDrops.percentage.toFixed(1)}%) exceeds recommended 3% limit`);
  }
  
  // Check thermal limits
  const thermal = calculateThermalAnalysis(config);
  if (!thermal.withinLimits) {
    errors.push(`Conductor temperature (${thermal.conductorTemp}°C) exceeds safe limits`);
  } else if (thermal.safetyMargin < 20) {
    warnings.push(`Low thermal safety margin (${thermal.safetyMargin}°C)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
