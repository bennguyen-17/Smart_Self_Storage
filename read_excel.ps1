
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open('C:\Users\nguye\OneDrive - ttst.edu.vn\FPTU\FA26\SWP391\Document\Bảng Phân Việc.xlsx')
$sheet = $wb.Sheets.Item(1)
$maxRow = $sheet.UsedRange.Rows.Count
$maxCol = $sheet.UsedRange.Columns.Count

Write-Host "Rows: $maxRow, Cols: $maxCol"
for($i=1; $i -le 15; $i++) {
    $rowStr = ''
    for($j=1; $j -le $maxCol; $j++) {
        $cellText = $sheet.Cells.Item($i, $j).Text
        $rowStr += $cellText + ' | '
    }
    Write-Host $rowStr
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel)

