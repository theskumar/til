# Navigating between terminals

Update the `keybinding.json` with the following, this does't work with the split window but with the different terminals.

```json
[
    { "key": "cmd+]", "command": "workbench.action.terminal.focusNext", "when": "terminalFocus"},
    { "key": "cmd+[", "command": "workbench.action.terminal.focusPrevious", "when": "terminalFocus"},
]
```

To use `cmd+<num>` to focus on different terminals:

```json
    { "key": "cmd+1", "command": "workbench.action.terminal.focusAtIndex1", "when": "terminalFocus"},
    { "key": "cmd+2", "command": "workbench.action.terminal.focusAtIndex2", "when": "terminalFocus"},
    { "key": "cmd+3", "command": "workbench.action.terminal.focusAtIndex3", "when": "terminalFocus"},
    { "key": "cmd+4", "command": "workbench.action.terminal.focusAtIndex4", "when": "terminalFocus"},
    { "key": "cmd+5", "command": "workbench.action.terminal.focusAtIndex5", "when": "terminalFocus"},
```


To create new terminal using `cmd+n`:

```json
{ 
    "key": "cmd+n",
    "command": "workbench.action.terminal.new",
    "when": "terminalFocus && terminalHasBeenCreated || terminalFocus && terminalProcessSupported"
}
````

To kill the terminal using `cmd+w`:

```json
{ 
    "key": "cmd+w",
    "command": "workbench.action.terminal.kill",
    "when": "terminalFocus"
}
````

[source](https://github.com/jbranchaud/til/blob/master/vscode/toggle-between-terminals.md)
