
import * as XLSX from 'xlsx';
import { Holiday } from '../types';

// Defined based on user request (clean headers)
const COL_DATE = 'HOLIDAY_DATE';
const COL_DESC = 'HOLIDAY_DESC';

// For the template - Cleaned headers as requested
const TEMPLATE_HEADERS = [
    'HOLIDAY_AREA_CODE',
    'HOLIDAY_TYPE',
    'HOLIDAY_DESC',
    'APPLY_IND',
    'HOLIDAY_DATE',
    'COMPANY',
    'TRAN_TIMESTAMP',
    'HUB_BATCH_FLAG',
    'CNY_YEAR_END_SETTLE',
    'COUNTRY'
];

// Sample data for the template matching the headers
const TEMPLATE_DATA = [
    {
        'HOLIDAY_AREA_CODE': 'ABW',
        'HOLIDAY_TYPE': 'S',
        'HOLIDAY_DESC': 'New Years Day',
        'APPLY_IND': 'B',
        'HOLIDAY_DATE': '2024-01-01',
        'COMPANY': 'ALL',
        'TRAN_TIMESTAMP': '2023-12-09 00:00:00.000000',
        'HUB_BATCH_FLAG': 'N',
        'CNY_YEAR_END_SETTLE': 'N',
        'COUNTRY': 'CN'
    },
    {
        'HOLIDAY_AREA_CODE': 'ABW',
        'HOLIDAY_TYPE': 'S',
        'HOLIDAY_DESC': 'Spring Festival',
        'APPLY_IND': 'B',
        'HOLIDAY_DATE': '2024-02-10',
        'COMPANY': 'ALL',
        'TRAN_TIMESTAMP': '2023-12-09 00:00:00.000000',
        'HUB_BATCH_FLAG': 'N',
        'CNY_YEAR_END_SETTLE': 'N',
        'COUNTRY': 'CN'
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
                    // Check if the mandatory date column exists
                    if (row[COL_DATE]) {
                        let dateStr = '';
                        
                        // Handle Date Object (if cellDates: true worked)
                        if (row[COL_DATE] instanceof Date) {
                             // Adjust for timezone offset issues often found in Excel parsing
                             const year = row[COL_DATE].getFullYear();
                             const month = String(row[COL_DATE].getMonth() + 1).padStart(2, '0');
                             const day = String(row[COL_DATE].getDate()).padStart(2, '0');
                             dateStr = `${year}-${month}-${day}`;
                        } 
                        // Handle String (e.g., '2024-01-01')
                        else if (typeof row[COL_DATE] === 'string') {
                            dateStr = row[COL_DATE].trim();
                        }
                        // Handle Excel Serial Number (fallback)
                        else if (typeof row[COL_DATE] === 'number') {
                             // Basic excel date conversion logic
                             const date = new Date(Math.round((row[COL_DATE] - 25569)*86400*1000));
                             const year = date.getFullYear();
                             const month = String(date.getMonth() + 1).padStart(2, '0');
                             const day = String(date.getDate()).padStart(2, '0');
                             dateStr = `${year}-${month}-${day}`;
                        }

                        if (dateStr) {
                            newHolidays.push({
                                id: Date.now().toString() + Math.random().toString().slice(2),
                                name: row[COL_DESC] || 'Holiday', // Removed fallback logic
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
