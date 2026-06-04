Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
startupFolder = WshShell.SpecialFolders("Startup")

Set sc = WshShell.CreateShortcut(startupFolder & "\DeepLX.lnk")
sc.TargetPath = scriptDir & "\LaunchDeepLX.vbs"
sc.WorkingDirectory = scriptDir
sc.WindowStyle = 7
sc.Save()

MsgBox "DeepLX has been set to auto-start on boot." & vbCrLf & vbCrLf & "Shortcut created in Startup folder.", vbInformation, "DeepLX - Success"