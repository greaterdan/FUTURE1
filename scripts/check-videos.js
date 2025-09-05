const fs = require('fs');
const path = require('path');

const videoFiles = [
  'public/1.webm',
  'public/2.webm', 
  'public/3.webm',
  'public/4.webm',
  'public/Space_Time_Travel__Seamless_VJ_Loop_uhd_2533132_compressed.mp4',
  'public/zodiac/aries.webm',
  'public/zodiac/taurus.webm',
  'public/zodiac/gemini.webm',
  'public/zodiac/cancer.webm',
  'public/zodiac/leo.webm',
  'public/zodiac/virgo.webm',
  'public/zodiac/libra.webm',
  'public/zodiac/scorpio.webm',
  'public/zodiac/sagittarius.webm',
  'public/zodiac/capricorn.webm',
  'public/zodiac/aquarius.webm',
  'public/zodiac/pisces.webm'
];

console.log('Checking video files...');
videoFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const size = exists ? fs.statSync(file).size : 0;
  console.log(`${file}: ${exists ? 'EXISTS' : 'MISSING'} (${size} bytes)`);
});

console.log('\nVideo files check complete.');
