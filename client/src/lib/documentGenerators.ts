import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import type { ElectricalComponent } from "@shared/schema";

interface ConfigData {
  name?: string;
  voltage?: number;
  current?: number;
  wireGauge?: string;
  totalLength?: number;
  isValid?: boolean;
  validationResults?: any;
}

interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  partNumber?: string;
  specifications?: Record<string, any>;
}

// ─── helpers ───────────────────────────────────────────────────────────────

function addPageHeader(doc: jsPDF, title: string, subtitle: string) {
  // Header bar
  doc.setFillColor(30, 58, 138); // dark blue
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("POWER WHIP CONFIGURATION TOOL", 14, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 17);

  // Title area
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(subtitle, 14, 34);

  // Divider
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(14, 37, 196, 37);

  // Date
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 196, 34, { align: "right" });
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(240, 244, 255);
  doc.rect(14, y - 4, 182, 8, "F");
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(title, 16, y + 1);
  return y + 10;
}

function addField(doc: jsPDF, label: string, value: string, x: number, y: number, labelW = 55) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(label + ":", x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text(value, x + labelW, y);
}

function pageFooter(doc: jsPDF, pageNum: number) {
  const total = doc.getNumberOfPages();
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Confidential – Power Whip Configuration Tool", 14, 290);
  doc.text(`Page ${pageNum} of ${total}`, 196, 290, { align: "right" });
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 287, 196, 287);
}

// ─── 1. Technical Specifications ──────────────────────────────────────────

export function generateTechnicalSpecificationsPDF(
  config: ConfigData,
  libraryComponents: ElectricalComponent[],
  canvasComponents: CanvasComponent[]
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addPageHeader(doc, "TECHNICAL SPECIFICATIONS", "Technical Specifications Report");

  let y = 44;

  // Configuration overview
  y = addSectionTitle(doc, "Configuration Overview", y);
  addField(doc, "Configuration Name", config.name || "PowerWhip-001", 14, y); y += 7;
  addField(doc, "System Voltage", `${config.voltage || 120} V`, 14, y);
  addField(doc, "Rated Current", `${config.current || 20} A`, 110, y); y += 7;
  addField(doc, "Wire Gauge", `AWG ${config.wireGauge || "12"}`, 14, y);
  addField(doc, "Total Length", `${config.totalLength || 0} ft`, 110, y); y += 7;
  addField(doc, "Compliance Status", config.isValid ? "✓ COMPLIANT" : "⚠ REVIEW REQUIRED", 14, y); y += 12;

  // Electrical parameters
  y = addSectionTitle(doc, "Electrical Parameters", y);
  const ampacity: Record<string, string> = { "10": "30 A", "12": "20 A", "14": "15 A", "8": "40 A", "6": "55 A" };
  const insulation: Record<string, string> = { "10": "600V THWN/XHHW", "12": "600V THWN", "14": "600V THHN", "8": "600V THWN-2", "6": "600V XHHW" };
  const gauge = config.wireGauge || "12";
  addField(doc, "Wire Ampacity", ampacity[gauge] || "20 A", 14, y); y += 7;
  addField(doc, "Insulation Rating", insulation[gauge] || "600V THWN", 14, y); y += 7;
  addField(doc, "Power (VA)", `${(config.voltage || 120) * (config.current || 20)} VA`, 14, y);
  addField(doc, "Power (kW)", `${(((config.voltage || 120) * (config.current || 20)) / 1000).toFixed(2)} kW`, 110, y); y += 7;
  addField(doc, "NEC Load Factor", "80% of rated current", 14, y);
  addField(doc, "Max Continuous", `${Math.floor((config.current || 20) * 0.8)} A`, 110, y); y += 12;

  // Compliance standards
  y = addSectionTitle(doc, "Applicable Standards & Compliance", y);
  const standards = [
    ["NEC Article 400", "Flexible Cords and Cables – sizing and installation requirements"],
    ["NEC Article 210", "Branch Circuits – general provisions for branch circuit design"],
    ["UL 62", "Flexible Cord and Fixture Wire – product safety standard"],
    ["OSHA 1926.405", "Electrical wiring methods, components, and equipment"],
    ["NFPA 70E", "Standard for Electrical Safety in the Workplace"],
  ];
  for (const [std, desc] of standards) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(std, 16, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(desc, 55, y);
    y += 6;
  }
  y += 4;

  // Component list
  const allComponents = canvasComponents.length > 0 ? canvasComponents : libraryComponents.slice(0, 10);
  if (allComponents.length > 0) {
    if (y > 220) { doc.addPage(); addPageHeader(doc, "TECHNICAL SPECIFICATIONS", "Component Details"); y = 44; }
    y = addSectionTitle(doc, "Component Specifications", y);

    // Table header
    doc.setFillColor(30, 58, 138);
    doc.rect(14, y - 3, 182, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Component Name", 16, y + 2);
    doc.text("Type", 90, y + 2);
    doc.text("Part No.", 120, y + 2);
    doc.text("Max V", 152, y + 2);
    doc.text("Max A", 172, y + 2);
    y += 9;

    allComponents.forEach((comp, i) => {
      if (y > 270) {
        pageFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        addPageHeader(doc, "TECHNICAL SPECIFICATIONS", "Component Details (cont.)");
        y = 44;
      }
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 3, 182, 6, "F");
      }
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const name = comp.name.length > 38 ? comp.name.slice(0, 35) + "..." : comp.name;
      doc.text(name, 16, y + 1);
      doc.text((comp.type || "-").slice(0, 14), 90, y + 1);
      doc.text((comp.partNumber || (comp as any).id || "-").slice(0, 14), 120, y + 1);
      doc.text(String((comp as any).maxVoltage || "-"), 152, y + 1);
      doc.text(String((comp as any).maxCurrent || "-"), 172, y + 1);
      y += 6;
    });
  }

  pageFooter(doc, doc.getNumberOfPages());
  doc.save(`TechnicalSpecifications_${(config.name || "PowerWhip").replace(/\s+/g, "_")}.pdf`);
}

// ─── 2. Installation Guide ────────────────────────────────────────────────

export function generateInstallationGuidePDF(
  config: ConfigData,
  canvasComponents: CanvasComponent[]
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addPageHeader(doc, "INSTALLATION GUIDE", "Installation & Wiring Guide");

  let y = 44;

  // Summary box
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(234, 179, 8);
  doc.rect(14, y, 182, 18, "FD");
  doc.setTextColor(120, 80, 0);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("⚠  IMPORTANT SAFETY NOTICE", 16, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("All installation work must be performed by a qualified licensed electrician in accordance with the NEC and all applicable local codes.", 16, y + 12);
  doc.text("De-energize and lock out / tag out (LOTO) all circuits before beginning any installation work.", 16, y + 17);
  y += 24;

  // Configuration summary
  y = addSectionTitle(doc, "Configuration Summary", y);
  addField(doc, "System Name", config.name || "PowerWhip-001", 14, y); y += 7;
  addField(doc, "Voltage", `${config.voltage || 120} V AC`, 14, y);
  addField(doc, "Current Rating", `${config.current || 20} A`, 110, y); y += 7;
  addField(doc, "Wire Gauge", `AWG ${config.wireGauge || "12"}`, 14, y);
  addField(doc, "Whip Length", `${config.totalLength || 0} ft`, 110, y); y += 12;

  // Step-by-step installation
  y = addSectionTitle(doc, "Step-by-Step Installation Procedure", y);
  const steps = [
    {
      num: "1",
      title: "Site Preparation & Safety",
      items: [
        "Verify the installation site meets all NEC and local code requirements.",
        "Confirm the branch circuit is properly rated for the load.",
        "Apply LOTO procedures — de-energize the circuit at the panel.",
        "Confirm circuit is de-energized with a calibrated voltage tester.",
      ],
    },
    {
      num: "2",
      title: "Material & Tool Verification",
      items: [
        `Confirm AWG ${config.wireGauge || "12"} wire rated for ${config.voltage || 120}V is on hand.`,
        "Inspect all components for damage or defects prior to installation.",
        "Gather required tools: wire stripper, torque screwdriver, multimeter, cable ties.",
        "Verify all connectors match the planned receptacle type.",
      ],
    },
    {
      num: "3",
      title: "Cable Routing & Management",
      items: [
        `Route the ${config.totalLength || 0} ft whip assembly from the source panel to the destination.`,
        "Avoid sharp bends — maintain minimum bend radius per NEC Article 400.",
        "Secure cable every 4.5 ft (1.4 m) using appropriate cable supports.",
        "Keep power cables separated from low-voltage signal cables.",
      ],
    },
    {
      num: "4",
      title: "Connector Termination",
      items: [
        "Strip wire ends per connector manufacturer specifications (typically 5/8\").",
        "Terminate conductors: Black → Hot (Line), White → Neutral, Green/Bare → Equipment Ground.",
        "Torque all terminals to manufacturer specifications — do not over-tighten.",
        "Inspect all connections for loose strands or exposed conductor.",
      ],
    },
    {
      num: "5",
      title: "Ground Continuity Verification",
      items: [
        "Verify equipment grounding conductor continuity from source to each outlet.",
        "Confirm ground resistance is < 1 Ω using a calibrated ground tester.",
        "Ensure all metallic enclosures and conduit are properly bonded.",
      ],
    },
    {
      num: "6",
      title: "Energization & Testing",
      items: [
        "Remove all LOTO devices and restore power at the panel.",
        "Verify correct voltage at all outlets with a calibrated meter.",
        "Test GFCI protection where required (15mA trip threshold).",
        "Perform a full load test and verify no voltage drop exceeds 3% (NEC recommendation).",
      ],
    },
    {
      num: "7",
      title: "Documentation & Sign-off",
      items: [
        "Record all torque values, test results, and wire labels in the project log.",
        "Attach a completed circuit directory label to the panel.",
        "Retain this installation guide with the project as-built documentation.",
      ],
    },
  ];

  for (const step of steps) {
    if (y > 255) {
      pageFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      addPageHeader(doc, "INSTALLATION GUIDE", "Installation Procedure (cont.)");
      y = 44;
    }
    // Step header
    doc.setFillColor(30, 58, 138);
    doc.circle(18, y - 1, 3.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(step.num, 18, y + 0.5, { align: "center" });

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(9.5);
    doc.text(step.title, 25, y + 0.5);
    y += 7;

    for (const item of step.items) {
      if (y > 270) {
        pageFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        addPageHeader(doc, "INSTALLATION GUIDE", "Installation Procedure (cont.)");
        y = 44;
      }
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("•", 20, y);
      const lines = doc.splitTextToSize(item, 160);
      doc.text(lines, 25, y);
      y += lines.length * 5 + 1;
    }
    y += 4;
  }

  // Components used
  if (canvasComponents.length > 0) {
    if (y > 230) {
      pageFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      addPageHeader(doc, "INSTALLATION GUIDE", "Components");
      y = 44;
    }
    y = addSectionTitle(doc, "Components in This Assembly", y);
    canvasComponents.forEach((comp, i) => {
      if (y > 270) { pageFooter(doc, doc.getNumberOfPages()); doc.addPage(); y = 44; }
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y - 3, 182, 6, "F"); }
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(comp.name, 16, y + 1);
      doc.text(comp.type || "-", 100, y + 1);
      doc.text(comp.partNumber || "-", 150, y + 1);
      y += 6;
    });
  }

  pageFooter(doc, doc.getNumberOfPages());
  doc.save(`InstallationGuide_${(config.name || "PowerWhip").replace(/\s+/g, "_")}.pdf`);
}

// ─── 3. Safety Instructions ───────────────────────────────────────────────

export function generateSafetyInstructionsPDF(config: ConfigData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addPageHeader(doc, "SAFETY INSTRUCTIONS", "Electrical Safety Instructions");

  let y = 44;

  // Critical warning banner
  doc.setFillColor(220, 38, 38);
  doc.rect(14, y, 182, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DANGER — RISK OF ELECTRIC SHOCK, FIRE, AND DEATH", 105, y + 6, { align: "center" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Read all safety instructions before proceeding. Failure to follow these instructions may result in serious injury or death.", 105, y + 11.5, { align: "center" });
  y += 20;

  const voltage = config.voltage || 120;
  const current = config.current || 20;

  // System parameters
  y = addSectionTitle(doc, "System Electrical Parameters", y);
  addField(doc, "Operating Voltage", `${voltage} V AC — ${voltage >= 277 ? "HIGH VOLTAGE" : "STANDARD VOLTAGE"}`, 14, y); y += 7;
  addField(doc, "Maximum Current", `${current} A`, 14, y);
  addField(doc, "Continuous Rating", `${Math.floor(current * 0.8)} A (80% NEC rule)`, 110, y); y += 7;
  addField(doc, "Wire Gauge", `AWG ${config.wireGauge || "12"}`, 14, y);
  addField(doc, "Minimum Conduit", voltage >= 277 ? "EMT 1/2\" min." : "Per NEC 358", 110, y); y += 12;

  // PPE Requirements
  y = addSectionTitle(doc, "Required Personal Protective Equipment (PPE)", y);
  const ppe = [
    ["Insulated Gloves", `Class ${voltage >= 277 ? "1 (7,500V rated)" : "0 (1,000V rated)"} rubber insulating gloves`],
    ["Safety Glasses", "ANSI Z87.1 rated impact-resistant safety glasses"],
    ["Arc Flash PPE", `Minimum Cat. ${current >= 30 ? "2" : "1"} arc-rated FR clothing — ${current >= 30 ? "8" : "4"} cal/cm²`],
    ["Voltage Tester", "Calibrated CAT III or CAT IV rated non-contact voltage tester"],
    ["Face Shield", "Arc-rated face shield when working within limited approach boundary"],
  ];
  ppe.forEach(([item, desc]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);
    doc.text("•  " + item + ":", 16, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(desc, 60, y);
    y += 6.5;
  });
  y += 4;

  // LOTO
  y = addSectionTitle(doc, "Lockout / Tagout (LOTO) Procedure", y);
  const loto = [
    "Notify all affected employees that equipment will be de-energized.",
    "Identify all energy sources (electrical, stored/mechanical) associated with this circuit.",
    "Shut off equipment and open the disconnecting means at the panel.",
    "Apply an approved lockout device and personal lock to the disconnecting means.",
    "Attempt to restart — verify equipment will not operate.",
    "Use a calibrated tester to verify absence of voltage at all terminals.",
    "After work: remove all tools, restore guards, notify personnel, remove LOTO device, restore power.",
  ];
  loto.forEach((step, i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, 250, 252);
    doc.rect(14, y - 3.5, 182, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${i + 1}.`, 16, y + 0.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(step, 168);
    doc.text(lines, 22, y + 0.5);
    y += lines.length * 5 + 1.5;
  });
  y += 6;

  if (y > 200) { pageFooter(doc, doc.getNumberOfPages()); doc.addPage(); addPageHeader(doc, "SAFETY INSTRUCTIONS", "Safety Rules & Compliance"); y = 44; }

  // Critical safety rules
  y = addSectionTitle(doc, "Critical Electrical Safety Rules", y);
  const rules = [
    ["NEVER work on energized equipment", "unless specifically authorized and proper PPE is worn."],
    ["ALWAYS treat conductors as energized", "until proven de-energized with a calibrated tester."],
    ["NEVER bypass overcurrent protection", "— fuses and breakers protect against overloads and faults."],
    ["MAINTAIN minimum approach boundaries", `Limited: ${voltage >= 277 ? "42\"" : "36\""} | Restricted: ${voltage >= 277 ? "15\"" : "12\""}`],
    ["REPORT all electrical incidents", "immediately, including near-misses and equipment damage."],
    ["USE only listed/approved components", "— never use components with damaged insulation or housings."],
  ];
  rules.forEach(([rule, detail]) => {
    if (y > 265) { pageFooter(doc, doc.getNumberOfPages()); doc.addPage(); y = 44; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 20, 20);
    doc.text("⚠  " + rule, 16, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(detail, 16, y + 5);
    y += 11;
  });
  y += 4;

  // Compliance references
  if (y > 240) { pageFooter(doc, doc.getNumberOfPages()); doc.addPage(); addPageHeader(doc, "SAFETY INSTRUCTIONS", "Compliance References"); y = 44; }
  y = addSectionTitle(doc, "Regulatory Compliance References", y);
  const regs = [
    ["NFPA 70 (NEC)", "National Electrical Code — primary standard for electrical installations"],
    ["NFPA 70E", "Standard for Electrical Safety in the Workplace"],
    ["OSHA 29 CFR 1910.333", "Electrical safety-related work practices"],
    ["OSHA 29 CFR 1926.405", "Construction electrical wiring — general requirements"],
    ["UL 62", "Flexible Cord and Fixture Wire safety standard"],
    ["ANSI/IEEE C2", "National Electrical Safety Code (NESC)"],
  ];
  regs.forEach(([std, desc], i) => {
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y - 3, 182, 6, "F"); }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(std, 16, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(desc, 65, y + 1);
    y += 6;
  });
  y += 8;

  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(234, 179, 8);
  doc.rect(14, y, 182, 14, "FD");
  doc.setTextColor(120, 80, 0);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Emergency Contact Information", 16, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text("In case of electrical emergency: disconnect power, call 911. Do not touch an energized person — cut power first.", 16, y + 11);

  pageFooter(doc, doc.getNumberOfPages());
  doc.save(`SafetyInstructions_${(config.name || "PowerWhip").replace(/\s+/g, "_")}.pdf`);
}

// ─── 4. Bill of Materials (XLSX) ──────────────────────────────────────────

export function generateBillOfMaterialsXLSX(
  config: ConfigData,
  libraryComponents: ElectricalComponent[],
  canvasComponents: CanvasComponent[]
) {
  const wb = XLSX.utils.book_new();

  // ── BOM sheet ──────────────────────────────────────────────────────────
  const componentSource: any[] = canvasComponents.length > 0 ? canvasComponents : libraryComponents;

  const headers = [
    "Item #", "Part Number", "Component Name", "Type", "Category",
    "Max Voltage (V)", "Max Current (A)", "Wire Gauge Compatibility",
    "Unit Price ($)", "Qty", "Total Price ($)", "Notes",
  ];

  // Count duplicates for quantity
  const countMap: Record<string, number> = {};
  for (const c of componentSource) {
    const key = c.partNumber || c.name;
    countMap[key] = (countMap[key] || 0) + 1;
  }
  const seen = new Set<string>();
  const rows: any[][] = [];
  let grandTotal = 0;
  let itemNum = 1;

  for (const comp of componentSource) {
    const key = comp.partNumber || comp.name;
    if (seen.has(key)) continue;
    seen.add(key);
    const qty = countMap[key] || 1;
    const price = comp.price ?? 0;
    const total = price * qty;
    grandTotal += total;
    rows.push([
      itemNum++,
      comp.partNumber || comp.id || "-",
      comp.name,
      comp.type || "-",
      comp.category || "-",
      comp.maxVoltage ?? "-",
      comp.maxCurrent ?? "-",
      Array.isArray(comp.compatibleGauges) ? comp.compatibleGauges.join(", ") : "-",
      price > 0 ? price.toFixed(2) : "-",
      qty,
      total > 0 ? total.toFixed(2) : "-",
      "",
    ]);
  }

  // Summary row
  rows.push([]);
  rows.push(["", "", "", "", "", "", "", "", "", "GRAND TOTAL", grandTotal > 0 ? grandTotal.toFixed(2) : "-", ""]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Column widths
  ws["!cols"] = [
    { wch: 7 }, { wch: 18 }, { wch: 34 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Bill of Materials");

  // ── Summary sheet ──────────────────────────────────────────────────────
  const summaryData = [
    ["POWER WHIP CONFIGURATION — BILL OF MATERIALS SUMMARY"],
    [],
    ["Configuration Name", config.name || "PowerWhip-001"],
    ["Generated Date", new Date().toLocaleString()],
    ["System Voltage", `${config.voltage || 120} V`],
    ["Rated Current", `${config.current || 20} A`],
    ["Wire Gauge", `AWG ${config.wireGauge || "12"}`],
    ["Total Length", `${config.totalLength || 0} ft`],
    ["Compliance Status", config.isValid ? "COMPLIANT" : "REVIEW REQUIRED"],
    [],
    ["SUMMARY STATISTICS"],
    ["Total Unique Components", seen.size],
    ["Total Items (incl. qty)", componentSource.length],
    ["Estimated Total Cost", grandTotal > 0 ? `$${grandTotal.toFixed(2)}` : "N/A"],
    [],
    ["APPLICABLE STANDARDS"],
    ["NEC Article 400", "Flexible Cords and Cables"],
    ["UL 62", "Flexible Cord and Fixture Wire"],
    ["OSHA 1926.405", "Electrical Wiring Methods"],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  XLSX.writeFile(wb, `BOM_${(config.name || "PowerWhip").replace(/\s+/g, "_")}.xlsx`);
}
