import * as XLSX from 'xlsx';
import { Holiday } from '../types';

// Standard headers for a generic calculator
const COL_DATE = 'Date';
const COL_NAME = 'Name';

const TEMPLATE_HEADERS = [
    'Date',
    'Name'
];

// Simple sample data
const TEMPLATE_DATA = [
    {
        'Date': '2024-01-01',
        'Name': 'New Year\'s Day'
    },
    {
        'Date': '2024-02-10',
        'Name': 'Spring Festival'
    }
];

export const downloadHolidayTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_DATA, { header: TEMPLATE_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holidays");
    XLSX.writeFile(wb, "Holiday_Import_Template.xlsx");
};

export const parseHolidayExcel = async (file: File): Promise<Holiday[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Parse to JSON
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

                const newHolidays: Holiday[] = [];

                jsonData.forEach((row: any) => {
                    // Try to find date in common columns if specific one missing
                    // Case insensitive search for common date/name headers
                    const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date') || k.toLowerCase() === 'dt');
                    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('desc') || k.toLowerCase().includes('holiday'));
                    
                    const dateVal = row[COL_DATE] || (dateKey ? row[dateKey] : null);
                    const nameVal = row[COL_NAME] || (nameKey ? row[nameKey] : null);

                    if (dateVal) {
                        let dateStr = '';
                        
                        // Handle Date Object (if cellDates: true worked)
                        if (dateVal instanceof Date) {
                             // Adjust for timezone offset issues often found in Excel parsing
                             const year = dateVal.getFullYear();
                             const month = String(dateVal.getMonth() + 1).padStart(2, '0');
                             const day = String(dateVal.getDate()).padStart(2, '0');
                             dateStr = `${year}-${month}-${day}`;
                        } 
                        // Handle String (e.g., '2024-01-01')
                        else if (typeof dateVal === 'string') {
                            dateStr = dateVal.trim();
                        }
                        // Handle Excel Serial Number (fallback)
                        else if (typeof dateVal === 'number') {
                             // Basic excel date conversion logic
                             const date = new Date(Math.round((dateVal - 25569)*86400*1000));
                             const year = date.getFullYear();
                             const month = String(date.getMonth() + 1).padStart(2, '0');
                             const day = String(date.getDate()).padStart(2, '0');
                             dateStr = `${year}-${month}-${day}`;
                        }

                        if (dateStr) {
                            newHolidays.push({
                                id: Date.now().toString() + Math.random().toString().slice(2),
                                name: nameVal || 'Holiday', // Default name
                                startDate: dateStr,
                                endDate: dateStr // Excel usually lists single days, so start=end
                            });
                        }
                    }
                });

                resolve(newHolidays);

            } catch (error) {
                console.error("Excel parse error:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};