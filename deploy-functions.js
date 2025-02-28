
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to check if the directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
};

// Function to deploy a specific function
const deployFunction = (functionName) => {
  try {
    console.log(`Deploying function: ${functionName}`);
    execSync(`npx supabase functions deploy ${functionName}`, { stdio: 'inherit' });
    console.log(`Successfully deployed function: ${functionName}`);
    return true;
  } catch (error) {
    console.error(`Failed to deploy function ${functionName}:`, error.message);
    return false;
  }
};

// Main function to deploy all functions
const deployAllFunctions = () => {
  const functionsDir = path.join(__dirname, 'supabase', 'functions');
  
  if (!directoryExists(functionsDir)) {
    console.error('Functions directory does not exist:', functionsDir);
    return;
  }
  
  // Get all subdirectories in the functions directory
  const functionNames = fs.readdirSync(functionsDir)
    .filter(file => directoryExists(path.join(functionsDir, file)));
  
  console.log('Found functions:', functionNames);
  
  // Deploy each function
  let successCount = 0;
  for (const functionName of functionNames) {
    const success = deployFunction(functionName);
    if (success) successCount++;
  }
  
  console.log(`Deployment completed. Successfully deployed ${successCount}/${functionNames.length} functions.`);
};

// Execute the main function
deployAllFunctions();
