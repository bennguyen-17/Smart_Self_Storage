
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open('C:\Users\nguye\OneDrive - ttst.edu.vn\FPTU\FA26\SWP391\Document\Bảng Phân Việc.xlsx')
$sheet = $wb.Sheets.Item(1)

# Find US-06 and change its Sprint to Sprint 2
$maxRow = $sheet.UsedRange.Rows.Count
for($i=1; $i -le $maxRow; $i++) {
    if ($sheet.Cells.Item($i, 1).Text -eq 'US-06') {
        # Change the sprint column. Let's find which column is Sprint.
        # Assuming Sprint is column 8 (but wait, what is the structure?)
        $us6Row = $i
        break
    }
}
Write-Host "US-06 is at row $us6Row"

# I need the exact columns first. Let's dump just the headers and US-06 row.
Write-Host "Headers:"
$h = ''
for($j=1; $j -le 10; $j++) { $h += $sheet.Cells.Item(1, $j).Text + '|' }
Write-Host $h

$r = ''
for($j=1; $j -le 10; $j++) { $r += $sheet.Cells.Item($us6Row, $j).Text + '|' }
Write-Host $r

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

