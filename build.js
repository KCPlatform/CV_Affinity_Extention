const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const sourceDir = './src';
const buildDir = './build';


// Check if --production flag is used
const isProduction = process.argv.includes('--production');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
} else {
  fs.readdirSync(buildDir).forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  });
}

function copyToBuild(source, destination) {
  if (typeof source !== 'string' || typeof destination !== 'string') {
    console.warn(`Skipping copy for invalid source or destination`);
    return;
  }
  
  if (fs.lstatSync(source).isDirectory()) {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }
    fs.readdirSync(source).forEach(file => {
      const srcPath = path.join(source, file);
      const destPath = path.join(destination, file);
      copyToBuild(srcPath, destPath);
    });
  } else {
    fs.copyFileSync(source, destination);
  }
}

// Copy source files to build directory
copyToBuild(sourceDir, buildDir);

// Read env.json
const env = JSON.parse(fs.readFileSync('./env.json', 'utf8'));

// Process manifest
const manifestTemplatePath = './manifest.template.json';
let manifestContent = fs.readFileSync(manifestTemplatePath, 'utf8');

// Read the key file
const keyFilePath = env.KEY_FILE || './key.txt';
const key = fs.readFileSync(keyFilePath, 'utf8').trim();

// Replace placeholders in manifest
Object.keys(env).forEach(key => {
  const placeholder = `__${key}__`;
  manifestContent = manifestContent.replace(new RegExp(placeholder, 'g'), env[key]);
});

// Parse the manifest content to a JavaScript object
let manifestObject = JSON.parse(manifestContent);

if (isProduction) {
    // Remove the "key" field for production builds
    delete manifestObject.key;
  } else {
    // Set the "key" field for non-production builds
    manifestObject.key = key;
  }
  
  // Convert the manifest object back to a JSON string
  manifestContent = JSON.stringify(manifestObject, null, 2);
  
  // Write processed manifest to build directory
  fs.writeFileSync(path.join(buildDir, 'manifest.json'), manifestContent);
  console.log('Processed and copied manifest.json');
  
  // Process config
  let configTemplate = fs.readFileSync('./config.template.js', 'utf8');
  Object.keys(env).forEach(key => {
    const placeholder = `__${key}__`;
    configTemplate = configTemplate.replace(new RegExp(placeholder, 'g'), env[key]);
  });
  fs.writeFileSync(path.join(buildDir, 'config.js'), configTemplate);
  console.log('Processed and copied config.js');
  
  if (isProduction) {
    console.log('Creating production zip file...');
    
    const output = fs.createWriteStream('./extension.zip');
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });
  
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('Production zip file has been finalized and the output file descriptor has closed.');
    });
  
    archive.on('error', function(err) {
      throw err;
    });
  
    archive.pipe(output);
  
    // Add the contents of the build directory to the zip
    archive.directory(buildDir, false);
  
    archive.finalize();
  }
  
  console.log(`Build process completed. Output in ./build directory${isProduction ? ' and extension.zip' : ''}`);