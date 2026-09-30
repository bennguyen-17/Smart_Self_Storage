
const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('C:/Users/nguye/OneDrive - ttst.edu.vn/FPTU/FA26/SWP391/Document/Bảng Phân Việc.xlsx');
    const sheet = workbook.worksheets[0];
    sheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
        console.log(rowNumber + ' ' + row.getCell(1).value + ' | ' + row.getCell(2).value + ' | Sprint: ' + row.getCell(7).value);
    });
}
run();

