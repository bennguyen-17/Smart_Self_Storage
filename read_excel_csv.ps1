
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open('C:\Users\nguye\OneDrive - ttst.edu.vn\FPTU\FA26\SWP391\Document\Bảng Phân Việc.xlsx')
$sheet = $wb.Sheets.Item(1)
$maxRow = $sheet.UsedRange.Rows.Count
$maxCol = $sheet.UsedRange.Columns.Count

$csv = @()
for($i=1; $i -le $maxRow; $i++) {
    $rowStr = ''
    for($j=1; $j -le $maxCol; $j++) {
        $cellText = $sheet.Cells.Item($i, $j).Text
        $cellText = $cellText -replace '
', ' ' -replace '', '' -replace '\t', ' '
        $rowStr += $cellText + '	'
    }
    $csv += $rowStr
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
$csv | Out-File 'excel_dump.tsv' -Encoding utf8

