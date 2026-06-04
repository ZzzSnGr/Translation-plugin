Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
exePath = scriptDir & "\deeplx.exe"

If fso.FileExists(exePath) Then
    WshShell.Run """" & exePath & """", 0, False
End If