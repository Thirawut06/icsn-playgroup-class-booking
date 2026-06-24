$json = '{"email":"test999@example.com","password":"testpassword123"}'
$key = (Get-Content supabase-config.js | Select-String "const supabaseAnonKey = '" | ForEach-Object { $_.Line.Split("'")[1] })
try {
  Invoke-RestMethod -Uri "https://psusuyesaxuhiondxqie.supabase.co/auth/v1/signup" -Method Post -Headers @{"apikey"=$key; "Content-Type"="application/json"} -Body $json
} catch {
  Write-Output "Error details:"
  $_.ErrorDetails.Message
}
