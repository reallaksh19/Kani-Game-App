import { Question } from '../types';

export const parseCSV = (csv: string): Question[] => {
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
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                    continue;
                }
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
            i++;
        }
        values.push(current.trim());

        // Create object from headers and values
        const obj: any = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] || '';
        });

        // Map know_more to explanation if not present
        if (!obj.explanation && obj.know_more) {
            obj.explanation = obj.know_more;
        }

        return obj as Question;
    });
};

export default parseCSV;
