# Hidden Gems: Community Edition

Hey all, we just published [Hidden Gems: Team Edition Part
1](https://zed.dev/blog/hidden-gems-part-1), the first in a series of blog posts
where we document some of our favorite hidden features and personal workflows we
use in Zed. We plan to write community editions for this series as well and
would love to learn about your favorite tips and tricks.

Feel free to use this GitHub Discussion as a place to share your Hidden Gems and
upvote those you find useful. We'll sweep through the posts here and build
community editions around tips that are popular (determined by upvotes) or that
we find unique and useful. We already have your GitHub handle, but if you want
to leave your name as well for attribution, feel free. If needed, include
screenshots as well!

Excited to learn about your hidden Zed gems! 💎

## Comments

### Comment by @jorgejhms

I don't know how hidden gem it is, but I changed the commit model to
gemini-2.0-flash from my gemini api key, which is free to use. Only set up this
at your config:

```
agent: {
    "commit_message_model": {
      "provider": "google",
      "model": "gemini-2.0-flash"
    }
}
```

#### Replies

- **@thraizz:** You cannot customize the prompt here, right? To make it write conventional commits

- **@jorgejhms:** no AFAIK, I would love it to have conventional commits...

---

### Comment by @warrenjokinen

Those 💎 were awesome!

**Today I Learned** that file names can contain emojis (I am on a Mac.) So, in
the Project Panel you can use the Rename context menu and put emojis at the
leading or trailing or middle of a file name.

Zed does not give a warning about this, like it does for whitespace (it probably should.)

Hope you like that one, and certainly keep posting more 💎 !

#### Replies

- **@MRiabov:** Some languages like Mojo lang support emojis as file extensions.

- **@warrenjokinen:** Wow. It does look like the Mac can have files with emojis as extensions, this file name apparently "works":

TODO . 👀

Aside... I have chipmunk ( 🐿️ ) emoji on my OS, but I don't have squirrel, yet !!

- **@warrenjokinen:** 🐿️
  I found several Mojo language syntax highlighter extensions for VS Code, but none available for Zed, yet (?)

- **@MRiabov:** > 🐿️ I found several Mojo language syntax highlighter extensions for VS Code, but none available for Zed, yet (?)

it's an unstable language yet, kind of. Hopefully will be as popular as rust and python combined though.

---

### Comment by @jmacey

I setup zed so I could use it with the Maya and Houdini animation tools, for
Houdini just set as external editor. For maya it needed a little more work and a
script described here
https://nccastaff.bournemouth.ac.uk/jmacey/post/ZedMaya/ZedMaya/ I'm also using
it in class and have started to set some default stuff for students, will write
this up soon.

---

### Comment by @schpet

zed's diff editor is incredibly nice, the `git: diff` one. the combination of multibuffers, additions and removals, and syntax highlighting is amazing.

i've found that i often want to use it to review other changes...

because i use [jj](https://jj-vcs.github.io/jj/latest/), and [colocate](https://jj-vcs.github.io/jj/latest/git-compatibility/#colocated-jujutsugit-repos) all my git repos, i am able to run `jj edit <ref>` in the terminal, run `git: diff` in zed and view a diff for any existing commits. you can even review entire branches (i.e. PRs) with this idea – requires a bit of squashing and stuff, but if you are reviewing a big diff it's much nicer than the github ui :4)

---

### Comment by @brycefranzen

`k9s` and `lazygit` tasks with full-size centered terminal:

```json
[
  {
    "label": "lazygit",
    "command": "lazygit",
    "cwd": "${ZED_WORKTREE_ROOT}",
    "hide": "on_success",
    "use_new_terminal": true,
    "allow_concurrent_runs": false,
    "reveal_target": "center"
  },
  {
    "label": "k9s",
    "command": "k9s",
    "cwd": "${ZED_WORKTREE_ROOT}",
    "hide": "on_success",
    "use_new_terminal": true,
    "allow_concurrent_runs": false,
    "reveal_target": "center"
  }
]
```

Keybindings similar to lazyvim:

````json
[
  {
    "context": "EmptyPane || SharedScreen",
    "bindings": {
      "space g g": ["task::Spawn", { "task_name": "lazygit" }],
      "space k s": ["task::Spawn", { "task_name": "k9s" }]
    }
  },
]

---

### Comment by @brycefranzen

Add bun test quick actions to bun test files:
Task:
```json
[
  {
    "label": "Bun Test",
    "command": "bun test",
    "args": ["\"$ZED_RELATIVE_FILE\" -t=\"$ZED_SYMBOL\""],
    "tags": ["js-test", "ts-test", "bun-test", "tsx-test"]
  },
]
````

Looks like this in the file (can click to run the test):
<img width="854" height="361" alt="image" src="https://github.com/user-attachments/assets/97bd0146-d2ad-4028-b92e-609f472b71e0" />

#### Replies

- **@yajo:** How can you find what tags exist? I'm interested in Python for example.

Self-answer: https://github.com/search?q=repo%3Azed-industries%2Fzed%20path%3A%2F%5Ecrates%5C%2Flanguages%5C%2Fsrc%5C%2F%2F%20tags&type=code

---

### Comment by @brycefranzen

Make zed behave more like lazyvim.

Here are several of my keybindings that allow me to fully navigate zed without touching the mouse:

````js
[
  // Allow changing panes without the mouse (ctrl + vim direction keys)
  {
    "bindings": {
      "ctrl-h": "workspace::ActivatePaneLeft",
      "ctrl-l": "workspace::ActivatePaneRight",
      "ctrl-k": "workspace::ActivatePaneUp",
      "ctrl-j": "workspace::ActivatePaneDown"
    }
  },

  // Allow changing tabs without mouse (shift + vim direction keys)
  {
    "context": "VimControl && !menu",
    "bindings": {
      "L": "pane::ActivateNextItem",
      "H": "pane::ActivatePreviousItem"
    }
  },

  // Allow changing panes and tabs when the terminal is focused (ctrl + vim direction keys)
  {
    "context": "Terminal",
    "bindings": {
      "ctrl-k": "workspace::ActivatePaneUp",
      "ctrl-l": "workspace::ActivatePaneRight",
      "ctrl-h": "workspace::ActivatePaneLeft",
      "ctrl-n": "workspace::NewTerminal",
      "ctrl-shift-h": "pane::ActivatePreviousItem",
      "ctrl-shift-l": "pane::ActivateNextItem"
    }
  },

  // Add ability to navigate through menu items with (ctrl + n, ctrl + p)
  // ctrl + n works by default, but ctrl + p didn't in some cases due to conflicts
  {
    "context": "(FileFinder || FileFinder > Picker > Editor)",
    "bindings": {
      "ctrl-p": null
    }
  },
  {
    "context": "",
    "bindings": {
      "ctrl-p": "menu::SelectPrevious"
    }
  },

  // Auto exit insert mode and save when pressing ctrl + s
  {
    "context": "Editor && vim_mode == insert && !VimWaiting && !menu",
    "bindings": {
      "ctrl-s": ["workspace::SendKeystrokes", "escape ctrl-s"]
    }
  },

  // Comment current line with ctrl + /, but then move the cursor to the line below after
  // this allows typing ctrl + / multiple times to comment multiple lines
  {
    "context": "Editor",
    "bindings": {
      "ctrl-/": ["workspace::SendKeystrokes", "ctrl-/ down"],
    }
  },
]

#### Replies

- **@papadavis47:** I have copied over a few of these 👍🏼  Thank you 😄

- **@bearmoth:** Nice! I had an attempt at this myself, so I'll compare notes ;)

---

### Comment by @k3rn31

I was reading in Oct the 7th "Hidden Gems" post the suggestion of using save on
focus change. I wanted a behaviour JetBrains style where everything is saved
instantly, change focus or not. Here my little gem:

```json
"autosave": {
  "after_delay": {
    "milliseconds": 0
  }
}
````

---

### Comment by @JosephTLyons

Posting this [tip](https://github.com/zed-industries/zed/discussions/22581#discussion-7772359) from @baldwindavid for configuring [television](https://github.com/alexpasmantier/television) in Zed to act like telescope.

---

> There's a been a lot of discussion about telescope-style search in #8279. There's some good workarounds/ideas there, but just posting a drop-in setup that leverages [television](https://github.com/alexpasmantier/television), a task, and keybinding.
>
> ## 1. Install [television](https://github.com/alexpasmantier/television)
>
> ## 2. Add a task for a file finder
>
> `tasks.json`
>
> ```json-comments
> {
>   "label": "file_finder",
>   "command": "zed \"$(tv files)\"",
>   "hide": "always",
>   "allow_concurrent_runs": true,
>   "use_new_terminal": true
> },
> ```
>
> ## 3. Add keybinding to open file finder in center terminal
>
> `keymap.json`
>
> ```json-comments
> // replace file_finder::Toggle
> "cmd-p": [
>   "task::Spawn",
>   { "task_name": "file_finder", "reveal_target": "center" }
> ],
> ```
>
> This should result in an interaction similar to...
>
> 2025-01-02T184704.mp4
>
> ### Searching file contents
>
> Television can search just about anything so, for example, file contents could also be searched with the `text` channel.
>
> ```json-comments
> {
>   "label": "fulltext_search",
>   "command": "zed \"$(tv text)\"",
>   "hide": "always",
>   "allow_concurrent_runs": true,
>   "use_new_terminal": true
> },
> ```

---

### Comment by @plpinet

Launch Zed terminal with a new tmux session specific to the project.

settings.json

```json
  "terminal": {
    "shell": {
      "with_arguments": {
        "program": "/usr/bin/bash",
        "args": ["-c", "tmux new-session -A -s \"$(basename \"$PWD\")\""]
      }
    }
  }
```

Very useful for people who are used not having to rely on the mouse to select, copy, navigate, etc. inside the terminal.

---

### Comment by @Homomorpheus

For LaTeX, it is very convenient to use double keytap keybindings. That way, two presses of a little-used key (but one which is easy to press) can be mapped to `\` or `{}` or even `\( \)`.

Here is an example for a german keyboard (ö and ä are on the home row):

```
{
    "context": "Editor && extension == tex",
    "bindings": {
      "ö ö": ["workspace::SendKeystrokes", "\\"],
      "ä ä": ["workspace::SendKeystrokes", "{"]
    }
  }
```

(This is something very useful that (as far as I know) Overleaf actually cannot do!)

Also, snippets are very useful for common blocks such as `equation` or `align*`.
Finally, following an idea by Ruben Zukic (keybinding to trigger action to trigger forward search) and this [link](https://github.com/latex-lsp/texlab/wiki/Previewing), SyncTeX is rather easy to set up. (SyncTeX also needs an extra flag to pdflatex.)

---

### Comment by @FollowTheProcess

Use [gomodifytags](https://github.com/fatih/gomodifytags) to automatically
generate Go struct tags for the symbol you're currently on (must be a struct
obviously)

```jsonc
[
  {
    "label": "Go: Add Struct Tags",
    "command": "gomodifytags",
    "args": [
      "-file",
      "$ZED_FILE",
      "-struct",
      "$ZED_SYMBOL",
      "-add-tags",
      "json",
      "-transform",
      "camelcase",
      "-skip-unexported",
      "-quiet",
      "-w",
    ],
    "reveal": "never",
    "hide": "always",
    "shell": {
      "with_arguments": {
        "program": "sh",
        "args": ["--noediting", "--norc", "--noprofile"],
      },
    },
  },
]
```
