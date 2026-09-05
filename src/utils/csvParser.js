// CSV Parser utility
// Handles parsing CSV data from Google Sheets

export const parseCSV = (csv) => {
  const lines = csv.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    return [];
  }

  // Parse headers
  const headers = lines[0]
    .split(',')
    .map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  // Parse data rows
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Create object from headers and values
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });

    return obj;
  });
};

export default parseCSV;
