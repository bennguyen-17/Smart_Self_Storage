
const ExcelJS = require('exceljs');

async function run() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'C:/Users/nguye/OneDrive - ttst.edu.vn/FPTU/FA26/SWP391/Document/Bảng Phân Việc.xlsx';
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    
    // Insert a new row after row 3 (which is headers)
    sheet.spliceRows(4, 0, []);
    const newRow = sheet.getRow(4);
    
    // Copy formatting from Row 5 (old US-01) to Row 4 (new US-01)
    const oldRow = sheet.getRow(5);
    oldRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber);
        newCell.style = Object.assign({}, cell.style);
    });

    // Populate new row
    newRow.getCell(1).value = 'US-01';
    newRow.getCell(2).value = 'Landing Page & Bảng Giá (Marketing Portal)';
    newRow.getCell(3).value = 'Là Khách vãng lai, tôi muốn xem Landing page giới thiệu dịch vụ, bảng giá 4 size kho và địa chỉ các cơ sở, để quyết định chọn thuê kho phù hợp.';
    newRow.getCell(4).value = 'Medium';
    newRow.getCell(5).value = 'Tâm';
    newRow.getCell(6).value = 'Khánh';
    newRow.getCell(7).value = 1;
    newRow.getCell(8).value = 'Xây dựng giao diện Landing page chuẩn SEO, hiển thị các kích thước kho, danh sách chi nhánh, bảng giá và các câu hỏi thường gặp (FAQ). Tích hợp nút Đặt kho ngay để chuyển hướng sang hệ thống Web Portal.';
    newRow.getCell(9).value = '【BR-07 - Quy chuẩn Danh mục Cơ sở】\nHiển thị 7 cơ sở kho lưu trữ.\n\n【BR-08 - Bảng giá & Tiền cọc】\nGiới thiệu 4 kích thước (Size S, M, L, XL) và bảng giá chuẩn trên trang chủ.';

    newRow.height = 100;
    
    // Now re-number all US IDs from row 5 down to the end
    // And move old US-06 (which is now in row 10) to Sprint 2
    let usCounter = 2;
    sheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
        if (rowNumber > 4) {
            let currentUsId = row.getCell(1).value;
            if (currentUsId && currentUsId.toString().startsWith('US-')) {
                row.getCell(1).value = 'US-' + (usCounter < 10 ? '0' + usCounter : usCounter);
                
                // If it was the old US-06 (No-Show Job), it is now US-07
                // Old US-06 was at row 10 (after insertion)
                if (rowNumber === 10) {
                    row.getCell(7).value = 2; // Move to Sprint 2
                }
                
                usCounter++;
            }
        }
    });

    await workbook.xlsx.writeFile(filePath);
    console.log('Update successful!');
}

run().catch(console.error);

