# Navigating between terminals

I use iTerm as my primarily navigation and had a time using the vscode in-built terminals because of the fact that it was very hard to navigate around with keyboard shortcuts. 

I've updated by keybindings to make it more intuitive. Add the following to your `keybindings.json`

Use `cmd+[` and `cmd+]` to focus on previous and next terminal.

```json
{ "key": "cmd+]", "command": "workbench.action.terminal.focusNext", "when": "terminalFocus"},
{ "key": "cmd+[", "command": "workbench.action.terminal.focusPrevious", "when": "terminalFocus"},
```

To use `cmd+<num>` to focus on different terminals:

```json
{ "key": "cmd+1", "command": "workbench.action.terminal.focusAtIndex1", "when": "terminalFocus"},
{ "key": "cmd+2", "command": "workbench.action.terminal.focusAtIndex2", "when": "terminalFocus"},
{ "key": "cmd+3", "command": "workbench.action.terminal.focusAtIndex3", "when": "terminalFocus"},
{ "key": "cmd+4", "command": "workbench.action.terminal.focusAtIndex4", "when": "terminalFocus"},
{ "key": "cmd+5", "command": "workbench.action.terminal.focusAtIndex5", "when": "terminalFocus"},
```


To create new terminal using `cmd+n`, the default was hard to remember.

```json
{ 
    "key": "cmd+n",
    "command": "workbench.action.terminal.new",
    "when": "terminalFocus && terminalHasBeenCreated || terminalFocus && terminalProcessSupported"
}
```

To kill the terminal using `cmd+w`:

```json
{ 
    "key": "cmd+w",
    "command": "workbench.action.terminal.kill",
    "when": "terminalFocus"
}
```

**Bonus:** I've configured `cmd+t` to quickly toggle between terminal and code editor.

```json
{
    "key": "cmd+t",
    "command": "workbench.action.terminal.focus",
    "when": "!terminalFocus"
},
{
    "key": "cmd+t",
    "command": "workbench.action.terminal.toggleTerminal"
},
```

[source](https://github.com/jbranchaud/til/blob/master/vscode/toggle-between-terminals.md)
