const fs = require('fs');
const path = require('path');

// 1. Copy generated images into ppt/media/
const mediaDir = path.join(__dirname, 'pptx_extracted', 'ppt', 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

const imageMap = {
  'diagram-09.png': 'diagram_09_architecture.png',
  'diagram-10.png': 'diagram_10_scraping_pipeline.png',
  'diagram-11.png': 'diagram_11_use_case.png',
  'diagram-12.png': 'diagram_12_dataflow.png',
  'screenshot-15-home.png': 'screenshot_15_home.png',
  'screenshot-15-detail.png': 'screenshot_15_detail.png',
  'screenshot-15-compare.png': 'screenshot_15_compare.png',
  'diagram-16.png': 'diagram_16_system_architecture.png'
};

for (const [targetName, srcName] of Object.entries(imageMap)) {
  const srcPath = path.join(__dirname, srcName);
  const targetPath = path.join(mediaDir, targetName);
  fs.copyFileSync(srcPath, targetPath);
  console.log(`Copied ${srcName} -> ${targetName}`);
}

// Helper to add relationship to .rels
function addRelationship(relsPath, id, type, target) {
  let xml = fs.readFileSync(relsPath, 'utf8');
  if (xml.includes(`Id="${id}"`)) return;
  const relStr = `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`;
  xml = xml.replace('</Relationships>', `${relStr}</Relationships>`);
  fs.writeFileSync(relsPath, xml, 'utf8');
  console.log(`Updated rels ${path.basename(relsPath)} with ${id}`);
}

const imgType = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';

// Update .rels for each slide
addRelationship('pptx_extracted/ppt/slides/_rels/slide11.xml.rels', 'rId5', imgType, '../media/diagram-09.png');
addRelationship('pptx_extracted/ppt/slides/_rels/slide12.xml.rels', 'rId5', imgType, '../media/diagram-10.png');
addRelationship('pptx_extracted/ppt/slides/_rels/slide13.xml.rels', 'rId5', imgType, '../media/diagram-11.png');
addRelationship('pptx_extracted/ppt/slides/_rels/slide14.xml.rels', 'rId5', imgType, '../media/diagram-12.png');
addRelationship('pptx_extracted/ppt/slides/_rels/slide17.xml.rels', 'rId5', imgType, '../media/screenshot-15-home.png');
addRelationship('pptx_extracted/ppt/slides/_rels/slide17.xml.rels', 'rId6', imgType, '../media/screenshot-15-detail.png');
addRelationship('pptx_extracted/ppt/slides/_rels/slide17.xml.rels', 'rId7', imgType, '../media/screenshot-15-compare.png');
addRelationship('pptx_extracted/ppt/slides/_rels/slide18.xml.rels', 'rId5', imgType, '../media/diagram-16.png');

// Helper to generate pic XML
function generatePicXml(id, name, rId, x, y, cx, cy) {
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

// 2. Update Full-Slide Diagram Slides: 11, 12, 13, 14, 18
const singleDiagramSlides = [
  { file: 'slide11.xml', rId: 'rId5', name: 'Architecture Diagram 09' },
  { file: 'slide12.xml', rId: 'rId5', name: 'Scraping Architecture Diagram 10', updateTitle: true },
  { file: 'slide13.xml', rId: 'rId5', name: 'Use Case Diagram 11' },
  { file: 'slide14.xml', rId: 'rId5', name: 'Dataflow Diagram 12' },
  { file: 'slide18.xml', rId: 'rId5', name: 'System Architecture Diagram 16' }
];

for (const s of singleDiagramSlides) {
  const filePath = path.join('pptx_extracted', 'ppt', 'slides', s.file);
  let xml = fs.readFileSync(filePath, 'utf8');

  // Replace placeholder dashed rect shape + placeholder text shape
  // They are the last two <p:sp> elements in <p:spTree>
  // Locate Shape 6 / dashed roundRect and placeholder text
  const picXml = generatePicXml(20, s.name, s.rId, 640080, 1554480, 10881360, 4572000);

  // Regex to remove the dashed placeholder shape and text
  // The placeholder shape has prst="roundRect" with dashed stroke
  xml = xml.replace(/<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Shape 6"[\s\S]*?<\/p:sp>\s*<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Text 7"[\s\S]*?<\/p:sp>/, picXml);

  if (s.updateTitle) {
    xml = xml.replace('<a:t>Architecture Diagram</a:t>', '<a:t>Scraping Architecture &amp; Pipeline</a:t>');
  }

  fs.writeFileSync(filePath, xml, 'utf8');
  console.log(`Updated ${s.file}`);
}

// 3. Update Slide 17 (Results and Discussion)
const slide17Path = path.join('pptx_extracted', 'ppt', 'slides', 'slide17.xml');
let xml17 = fs.readFileSync(slide17Path, 'utf8');

const pic1 = generatePicXml(21, 'Screenshot Home', 'rId5', 640080, 1600200, 3383280, 2651760);
const pic2 = generatePicXml(22, 'Screenshot Detail', 'rId6', 4389120, 1600200, 3383280, 2651760);
const pic3 = generatePicXml(23, 'Screenshot Compare', 'rId7', 8138160, 1600200, 3383280, 2651760);

// Replace Box 1: Shape 6 + Text 7
xml17 = xml17.replace(/<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Shape 6"[\s\S]*?<\/p:sp>\s*<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Text 7"[\s\S]*?<\/p:sp>/, pic1);

// Replace Box 2: Shape 9 + Text 10
xml17 = xml17.replace(/<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Shape 9"[\s\S]*?<\/p:sp>\s*<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Text 10"[\s\S]*?<\/p:sp>/, pic2);

// Replace Box 3: Shape 12 + Text 13
xml17 = xml17.replace(/<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Shape 12"[\s\S]*?<\/p:sp>\s*<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Text 13"[\s\S]*?<\/p:sp>/, pic3);

fs.writeFileSync(slide17Path, xml17, 'utf8');
console.log('Updated slide17.xml');

// 4. Update Slide 2 (Agenda) to clarify 09 and 10
const slide2Path = path.join('pptx_extracted', 'ppt', 'slides', 'slide2.xml');
let xml2 = fs.readFileSync(slide2Path, 'utf8');

// The agenda has Shape 31 (09 Architecture Diagram) and Shape 34 (10 Architecture Diagram)
// Let us replace Shape 31 with "System Architecture Diagram" and Shape 34 with "Scraping Architecture Diagram"
let occ = 0;
xml2 = xml2.replace(/<a:t>Architecture Diagram<\/a:t>/g, (match) => {
  occ++;
  if (occ === 1) return '<a:t>System Architecture Diagram</a:t>';
  if (occ === 2) return '<a:t>Scraping Architecture Diagram</a:t>';
  return match;
});

fs.writeFileSync(slide2Path, xml2, 'utf8');
console.log('Updated slide2.xml (Agenda)');

console.log('All slides updated successfully!');
