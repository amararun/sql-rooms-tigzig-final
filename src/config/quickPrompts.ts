// Quick Prompts Configuration
// =============================
// Easy to modify, add, edit, and reorder prompts
// Each prompt has:
// - id: unique identifier (no spaces, use underscores)
// - displayText: short text shown on the button (2-6 words)
// - description: tooltip description
// - actualPrompt: detailed prompt sent to the AI agent

export interface QuickPrompt {
  id: string;
  displayText: string;
  description: string;
  actualPrompt: string;
}

export const quickPrompts: QuickPrompt[] = [
  {
    id: "what_data",
    displayText: "What Data Do You Have",
    description: "Querying AI for data exploration",
    actualPrompt: `What data you have in the database? Share 2 sample rows from each table in markdown text format and your understandng of each of the fields`
  },
  {
    id: "analyze_cycling_data",
    displayText: "Analyze Cycling Data",
    description: "Show top-ranked Tour de France riders from 2015-2025",
    actualPrompt: `For Tour De France data - Show the Rank 1 riders from 2015 to 2025, with their total distance (km), total time in hours, and average speed (km/h) and the team. Table in Markdown text format.`
  },
  {
    id: "chart_top_winners",
    displayText: "Chart Top Winners",
    description: "Visualize riders with 3+ wins across Tour de France history",
    actualPrompt: `From the cycling Tour de France data, create a chart of riders who have won (i.e Rank 1) three  or more times across history, showing how many wins each has.`
  },
  {
    id: "dual-axis-chart",
    displayText: "Create 2-Axis Chart",
    description: "Example of a dual-axis chart",
    actualPrompt: `Create a dual axis chart for Tour De France data. Take the latest 10 years. Find the top 10 rank riders for each year. Find the average distance (km) and average speed (km/h) for each year. Then plot average distance (km) on the left y-axis as bars and the average speed (km/h) on the right y-axis as lines`
  }
];

// Instructions for adding new prompts:
// ====================================
// 1. Add a new object to the quickPrompts array above
// 2. Give it a unique id (no spaces, use underscores)
// 3. Set displayText to what you want shown on the button (2-6 words)
// 4. Set description for the tooltip (shown on hover)
// 5. Set actualPrompt to the detailed prompt for the AI
// 6. Save the file - changes will be reflected immediately

// Example of adding a new prompt:
// {
//   id: "new_analysis",
//   displayText: "Short Button Text",
//   description: "Tooltip description of what this does",
//   actualPrompt: `Your detailed multi-line prompt here.
//
//   Include:
//   1. Specific instructions
//   2. What data to analyze
//   3. Expected output format
//   4. Any special requirements`
// }
