$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Listening on http://localhost:8080/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        
        # --- API Routes Mock ---
        if ($path -eq "/api/config") {
            $envFile = Join-Path (Get-Location) ".env"
            $supabaseUrl = ""
            $supabaseKey = ""
            $hasWebhook = $false
            if (Test-Path $envFile) {
                Get-Content $envFile | ForEach-Object {
                    if ($_ -match "^SUPABASE_URL=(.*)$") { $supabaseUrl = $matches[1].Trim('`"').Trim() }
                    if ($_ -match "^SUPABASE_ANON_KEY=(.*)$") { $supabaseKey = $matches[1].Trim('`"').Trim() }
                    if ($_ -match "^GOOGLE_CHAT_WEBHOOK_URL=(.*)$" -and $matches[1].Trim() -ne "") { $hasWebhook = $true }
                }
            }
            $json = "{ `"supabaseUrl`": `"$supabaseUrl`", `"supabaseAnonKey`": `"$supabaseKey`", `"hasWebhook`": $(if($hasWebhook){"true"}else{"false"}) }"
            $content = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.Close()
            continue
        }
        
        if ($path -eq "/api/admin/verify") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            $envFile = Join-Path (Get-Location) ".env"
            $adminPass = "admin123"
            if (Test-Path $envFile) {
                Get-Content $envFile | ForEach-Object {
                    if ($_ -match "^ADMIN_PASSWORD=(.*)$" -and $matches[1].Trim() -ne "") { $adminPass = $matches[1].Trim('`"').Trim() }
                }
            }
            
            $success = "false"
            if ($body -match '"password"\s*:\s*"([^"]+)"') {
                if ($matches[1] -eq $adminPass) {
                    $success = "true"
                }
            }
            
            if ($success -eq "true") {
                $json = "{ `"success`": true }"
                $response.StatusCode = 200
            } else {
                $json = "{ `"success`": false, `"message`": `"Invalid admin password`" }"
                $response.StatusCode = 401
            }
            $content = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.Close()
            continue
        }

        if ($path -eq "/api/notify") {
            $json = "{ `"success`": true, `"simulated`": true }"
            $content = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.Close()
            continue
        }
        # -----------------------

        try {
            if ($path -eq "/") { $path = "/index.html" }
            
            if (-not [System.IO.Path]::HasExtension($path)) {
                $path = "$path.html"
            }

            $localPath = Join-Path (Get-Location) $path.TrimStart('/')

            if (Test-Path $localPath -PathType Leaf) {
                $content = [System.IO.File]::ReadAllBytes($localPath)
                $response.ContentLength64 = $content.Length
                
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                if ($ext -eq ".html") { $response.ContentType = "text/html; charset=utf-8" }
                elseif ($ext -eq ".css") { $response.ContentType = "text/css" }
                elseif ($ext -eq ".js") { $response.ContentType = "application/javascript" }
                elseif ($ext -eq ".png") { $response.ContentType = "image/png" }
                elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $response.ContentType = "image/jpeg" }
                
                $response.OutputStream.Write($content, 0, $content.Length)
            } else {
                $response.StatusCode = 404
                $err = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                $response.OutputStream.Write($err, 0, $err.Length)
            }
        } catch {
            $response.StatusCode = 400
            $err = [System.Text.Encoding]::UTF8.GetBytes("Bad Request")
            $response.OutputStream.Write($err, 0, $err.Length)
        }
        $response.Close()
    }
} catch {
    Write-Host "Server stopped."
} finally {
    $listener.Stop()
}
