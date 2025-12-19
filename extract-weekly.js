/**
 * rsaextract-weekly.js
 *
 * Extracts dated notes from markdown files and generates weekly summary files.
 * Based on the note format: `- DD Mon YYYY. Content here`
 *
 * Usage: node extract-weekly.js [--all]
 *   --all: Regenerate all weeks (default: only generate missing weeks)
 */

const fs = require("fs").promises;
const path = require("path");

// Files to process (add more as needed)
const SOURCE_FILES = ["til.md"];

// Output directory
const OUTPUT_DIR = "weekly";

/**
 * Extracts dated notes from markdown content
 * Notes must start with `- DD Mon YYYY` pattern
 */
function extractNotes(markdown) {
  const notes = [];
  let currentNote = null;

  markdown.split("\n").forEach((line) => {
    // Match lines starting with `- DD Mon YYYY`
    const match = line.match(
      /^- (?<day>\d{1,2}) (?<month>[A-Za-z]{3}) (?<year>\d{4})/,
    );

    if (match) {
      if (currentNote) notes.push(currentNote);
      const { day, month, year } = match.groups;
      currentNote = {
        date: new Date(`${month} ${day}, ${year}`),
        content: line,
      };
    } else if (currentNote) {
      // Include indented lines (2 spaces) as part of the note
      if (line.startsWith("  ")) {
        currentNote.content += "\n" + line;
      } else {
        // Non-indented line ends the current note - push it first!
        notes.push(currentNote);
        currentNote = null;
      }
    }
  });

  if (currentNote) notes.push(currentNote);
  return notes;
}

/**
 * Get the week-ending Sunday date in ISO format (YYYY-MM-DD)
 */
function getWeekEnd(date) {
  const d = new Date(date);
  // Move to next Sunday (day 0 = Sunday, so add days to reach next Sunday)
  const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

/**
 * Groups notes by their week-ending date
 */
function groupByWeek(notes) {
  const weeks = new Map();
  notes.forEach((note) => {
    const weekKey = getWeekEnd(note.date);
    if (!weeks.has(weekKey)) weeks.set(weekKey, []);
    weeks.get(weekKey).push(note);
  });
  return weeks;
}

/**
 * Format a single note for markdown output
 */
function formatNote(note) {
  const lines = note.content.split("\n");

  // Format the date nicely
  const dateStr = note.date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Replace the date prefix with formatted version
  lines[0] = lines[0].replace(/^- \d{1,2} [A-Za-z]{3} \d{4}\.?\s*/, `- `);

  return lines.join("\n");
}

/**
 * Generate markdown content for a week's notes
 */
function generateWeekMarkdown(weekEnd, notes) {
  const date = new Date(weekEnd);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let md = `# Week of ${formattedDate}\n\n`;
  md += `Things I learned during the week ending ${formattedDate}.\n\n`;

  // Sort notes by date (newest first within the week)
  const sortedNotes = notes.sort((a, b) => b.date - a.date);

  for (const note of sortedNotes) {
    md += formatNote(note) + "\n\n";
  }

  return md.trim() + "\n";
}

/**
 * Check if a file exists
 */
async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const regenerateAll = args.includes("--all");

  console.log(`Processing files: ${SOURCE_FILES.join(", ")}`);
  if (regenerateAll) {
    console.log("Mode: Regenerating ALL weeks");
  } else {
    console.log("Mode: Only generating MISSING weeks");
  }

  // Collect notes from all source files
  let allNotes = [];

  for (const file of SOURCE_FILES) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const notes = extractNotes(content);
      console.log(`  ${file}: ${notes.length} notes found`);
      allNotes = allNotes.concat(notes);
    } catch (err) {
      console.log(`  ${file}: Skipped (${err.message})`);
    }
  }

  if (allNotes.length === 0) {
    console.log("No notes found. Exiting.");
    return;
  }

  // Filter out current incomplete week
  const currentWeekEnd = getWeekEnd(new Date());
  const completedNotes = allNotes.filter(
    (note) => getWeekEnd(note.date) < currentWeekEnd,
  );

  console.log(
    `\nTotal notes: ${allNotes.length}, Completed weeks: ${completedNotes.length}`,
  );

  // Group by week
  const weeklyNotes = groupByWeek(completedNotes);
  console.log(`Weeks found: ${weeklyNotes.size}`);

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Generate markdown for each week
  let generated = 0;
  let skipped = 0;

  for (const [weekEnd, notes] of weeklyNotes) {
    const filename = path.join(OUTPUT_DIR, `${weekEnd}.md`);

    // Skip if file exists and we're not regenerating all
    if (!regenerateAll && (await fileExists(filename))) {
      skipped++;
      continue;
    }

    const content = generateWeekMarkdown(weekEnd, notes);
    await fs.writeFile(filename, content);
    console.log(`  Generated: ${filename} (${notes.length} notes)`);
    generated++;
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
