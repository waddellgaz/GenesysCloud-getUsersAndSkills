const fs = require('fs');

function convertToCSV(data) {
  // Create headers from the keys of the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV string
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(obj => {
    const row = headers.map(header => obj[header]);
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

// Sample data
const data = [
  { name: 'John', age: 30, city: 'New York' },
  { name: 'Alice', age: 25, city: 'Los Angeles' },
  { name: 'Bob', age: 35, city: 'Chicago' }
];

// Convert data to CSV
const csv = convertToCSV(data);

// Write CSV to a file
fs.writeFileSync('data.csv', csv);
