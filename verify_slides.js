const fs = require('fs');

const slides = ['slide2.xml', 'slide11.xml', 'slide12.xml', 'slide13.xml', 'slide14.xml', 'slide17.xml', 'slide18.xml'];

for (const s of slides) {
  const xml = fs.readFileSync(`pptx_extracted/ppt/slides/${s}`, 'utf8');
  const picMatches = [...xml.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g)];
  const hasInsertPlaceholder = xml.includes('Insert ');
  console.log(`${s}: pictures=${picMatches.length}, hasInsertPlaceholder=${hasInsertPlaceholder}`);
}
