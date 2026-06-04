Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
exePath = scriptDir & "\deeplx.exe"

If Not fso.FileExists(exePath) Then
    MsgBox "deeplx.exe not found!" & vbCrLf & vbCrLf & "Please make sure deeplx.exe is in the same folder as this script.", vbCritical, "DeepLX - Error"
    WScript.Quit
End If

WshShell.Run """" & exePath & """", 0, False
WScript.Sleep 2000

strComputer = "."
Set objWMIService = GetObject("winmgmts:\\" & strComputer & "\root\cimv2")
Set colProcesses = objWMIService.ExecQuery("Select * from Win32_Process Where Name = 'deeplx.exe'")

If colProcesses.Count > 0 Then
    MsgBox "DeepLX started successfully!" & vbCrLf & vbCrLf & "The translation service is running in background.", vbInformation, "DeepLX"
Else
    MsgBox "DeepLX failed to start!" & vbCrLf & vbCrLf & "Try running as Administrator or check if antivirus blocked it.", vbCritical, "DeepLX"
End If