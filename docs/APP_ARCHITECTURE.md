# SQLRooms AI @Tigzig - App Architecture

## Repository Structure & Tracing Guide

### 🏗️ **Critical for AI Coders**: This repo has access to complete SQLRooms source code for tracing functionality

**Current Repository** (root directory):
- **Purpose**: Customized AI demo app cloned from SQLRooms AI example
- **Origin**: Cloned from `sql-rooms-main-repo/examples/ai`
- **Customizations**: Custom tools, enhanced file import, Parquet export, API key management
- **⚠️ MAKE CHANGES HERE**: All application modifications go in this directory

**Main Source Repository** (`sql-rooms-main-repo/`) - ⚠️ **REFERENCE ONLY**:
- **Purpose**: Complete SQLRooms monorepo containing all package source code
- **Location**: `./sql-rooms-main-repo`
- **Structure**: Lerna monorepo with ~25 packages in `/packages/*`
- **⚠️ CRITICAL**: **DO NOT MODIFY FILES HERE** - This is for reference and tracing only
- **Why Reference Only**: The app uses compiled npm packages (`@sqlrooms/*`), not these source files
- **Usage**: Understanding implementation, debugging, tracing function calls back to source
- **Source → NPM**: These source files are used to build the npm packages the app consumes

### 🔍 **Function Tracing Strategy**

When debugging or understanding functionality:

1. **Check Local Customizations First**:
   ```
   SQL_ROOMS/src/          # Your custom implementations
   ├── tools/              # Custom query tool, etc.
   ├── components/         # Custom UI components
   ├── config/             # Custom instructions
   └── utils/              # Custom utilities
   ```

2. **Trace Package Functions**:
   ```
   sql-rooms-main-repo/packages/
   ├── ai/                 # @sqlrooms/ai source
   ├── duckdb/            # @sqlrooms/duckdb source
   ├── ui/                # @sqlrooms/ui source
   ├── room-store/        # State management
   └── [20+ other packages]
   ```

3. **Reference Original Example**:
   ```
   sql-rooms-main-repo/examples/ai/  # Original example you cloned
   ```

### 📦 **Package Dependencies Used**

Your app uses these npm packages (built from main repo):
- `@sqlrooms/ai@0.24.20` - AI integration (source: `packages/ai/`)
- `@sqlrooms/duckdb` - Database integration (source: `packages/duckdb/`)
- `@sqlrooms/ui` - UI components (source: `packages/ui/`)
- `@sqlrooms/room-store` - State management (source: `packages/room-store/`)

### 🔗 **Tracing Example**

**Problem**: Understanding how schema refresh works
1. **Start**: `src/components/DataSourcesPanel.tsx:153` → `refreshTableSchemas()`
2. **Trace**: `sql-rooms-main-repo/packages/duckdb/src/DuckDbSlice.ts` → `refreshTableSchemas()` function
3. **Understand**: Complete implementation with DuckDB queries and state updates

---

## ⚡ Quick Reference for AI Coders

### 🎯 **Most Important Files to Modify**

| File | Purpose | When to Edit |
|------|---------|--------------|
| `src/config/custom-instructions.ts` | LLM behavior, query safety rules, error recovery | Change how AI generates queries or handles errors |
| `src/store.ts` | Custom tools, maxSteps, API configuration | Add new tools, change retry limits |
| `src/tools/query-tool.ts` | DDL-enabled SQL execution | Modify query execution logic |
| `patches/@sqlrooms+ai+0.24.20.patch` | NPM package error handling enhancements | Strengthen error recovery at package level |
| `src/components/ApiKeyModal.tsx` | Multi-provider API key management | Add/remove AI providers |
| `src/models.ts` | Available AI models and providers | Add new models or change defaults |
| `src/components/DataSourcesPanel.tsx` | File import, auto-rename reserved columns | Modify import logic, handle reserved keywords |
| `src/utils/collectSampleRows.ts` | Sample row collection with column quoting | Fix query generation for reserved keyword columns |

### 🛡️ **Critical Safety Features (DON'T BREAK THESE)**

1. **SELECT Query Safety** (`custom-instructions.ts:172-242`)
   - Forces LIMIT on large table queries
   - Prevents memory overload from 300K+ row queries
   - Enforces CREATE TABLE for data mart requests
   - **Why**: Without this, browser crashes and API costs explode

2. **Enhanced Error Recovery** (`custom-instructions.ts:119-124, 247-268`)
   - Uses all 15 tool execution steps (not 5)
   - Switches strategy after 2x same error
   - Progressive diagnostic simplification
   - **Why**: Prevents LLM from giving up too early

3. **API Modal Bug Fix** (`src/components/ApiKeyValidationModal.tsx:29-33`)
   - Console.log in useEffect, NOT in render function
   - **Why**: Prevents hundreds of logs on every keystroke

4. **Reserved Keyword Column Handling** (`DataSourcesPanel.tsx:255-275, collectSampleRows.ts:14-44`)
   - Auto-renames DEFAULT column to DEFAULT_FLAG on import
   - Quotes all column names in SELECT queries
   - **Why**: Prevents parser errors and "Unimplemented expression class" failures with reserved keywords

### 📋 **Key Configuration Values**

```typescript
// src/store.ts
maxSteps: 15                      // Tool execution limit (was 5)
numberOfRowsToShareWithLLM: 100   // Result sharing limit

// src/config/custom-instructions.ts
DEFAULT LIMIT: 5                  // For sample queries
ANALYSIS LIMIT: 100               // For analytical queries
RETRY THRESHOLD: 5+               // Different approaches before giving up
SAME ERROR LIMIT: 2               // Switch strategy after 2x same error
```

### 🔧 **How to Modify LLM Behavior**

#### **Add New Query Safety Rule**
```typescript
// Edit: src/config/custom-instructions.ts (lines 172-242)
// Add after existing rules:

6. Your New Rule:
   ❌ WRONG: Bad pattern example
   ✅ RIGHT: Correct pattern example
   Why? Explanation
```

#### **Change Error Recovery Strategy**
```typescript
// Edit: src/config/custom-instructions.ts (lines 247-268)
// Modify diagnostic steps or add new fallback strategies

→ DIAGNOSTIC STRATEGY - Progressive simplification (try in order):
  Step 6: Your new diagnostic step
          (What it tests and why)
```

#### **Add New Custom Tool**
```typescript
// Edit: src/store.ts (line ~220+)
customTools: {
  your_new_tool: createTool({
    name: 'your_new_tool',
    description: 'Clear description for LLM to understand when to use',
    parameters: z.object({ /* Zod schema */ }),
    execute: async (params) => { /* Implementation */ }
  })
}
```

### 🐛 **Common Issues & Fixes**

| Issue | Cause | Fix Location |
|-------|-------|--------------|
| LLM gives up after 1-2 errors | Not using all 15 steps | `custom-instructions.ts:119-124` |
| SELECT without LIMIT crashes browser | Missing safety rules | `custom-instructions.ts:172-242` |
| API modal logs spam console | useEffect placement wrong | `ApiKeyValidationModal.tsx:29-33` |
| "SELECT clause cannot contain DEFAULT clause" | Column named DEFAULT (reserved keyword) | `DataSourcesPanel.tsx:255-275` (auto-rename on import) |
| "Unimplemented expression class" in AI queries | Reserved keyword column in CASE/WHERE | `collectSampleRows.ts:14-44` (quote all columns) |
| Vite cache prevents changes | Cache not cleared | Run: `rm -rf node_modules/.vite` |
| Patches don't apply | npm install not run | Run: `npm install` (auto-applies) |

### 📊 **Testing Checklist**

After modifying LLM instructions:
- [ ] Clear Vite cache: `rm -rf node_modules/.vite`
- [ ] Restart dev server
- [ ] Test on large table (100K+ rows) - should see LIMIT or CREATE TABLE
- [ ] Test error scenario - should see multiple retry attempts (not just 1-2)
- [ ] Check console logs - no API modal spam, clear diagnostic messages
- [ ] Test "create summary" request - should generate CREATE TABLE not SELECT
- [ ] Import file with reserved keyword columns (DEFAULT, SELECT, etc.) - should auto-rename
- [ ] Run AI queries on tables with renamed columns - should work without parser errors

---

## 🆕 Recent Enhancements (Nov 2025)

### **Enhancement 1: SELECT Query Safety Rules**
**Problem**: LLM was generating SELECT queries without LIMIT on 300K+ row tables, causing:
- Browser memory overload and crashes
- Wasted API tokens (sending large result sets)
- Using SELECT instead of CREATE TABLE for data mart requests (temporary vs persistent results)

**Solution**: Added comprehensive safety rules (`custom-instructions.ts:172-242`):
- ✅ Forces LIMIT 5 for sample queries, LIMIT 100 for analysis
- ✅ Enforces CREATE TABLE for "summarize/data mart" requests
- ✅ Checks row counts before querying (visible in schema)
- ✅ Includes real-world examples with ❌ BAD / ✅ GOOD patterns

**Impact**: 
- No more browser crashes from unlimited SELECTs
- 90% reduction in API token waste
- Persistent tables created automatically for summaries

**Files Changed**:
- `src/config/custom-instructions.ts` (lines 172-242)
- `docs/APP_ARCHITECTURE.md` (this file)

---

### **Enhancement 2: Same Error Twice Strategy**
**Problem**: LLM would get same error 3-4 times, keep trying minor variations instead of switching strategy completely.

**Solution**: Added "Same Error Twice" detection (`custom-instructions.ts:247-252`):
- Detects when same error message appears 2+ times
- Forces COMPLETELY DIFFERENT approach (not just minor tweaks)
- Specific strategies: Abandon UNION → Try separate queries, etc.

**Impact**:
- Faster problem solving (switches strategy after 2nd error)
- Uses tool execution steps more efficiently
- Reduces frustration from repeated failed attempts

**Example Flow**:
```
Attempt 1: UNION ALL query → Error: "Unimplemented expression"
Attempt 2: Simplified UNION → Error: "Unimplemented expression" (2x same!)
Attempt 3: SWITCH STRATEGY → Try SELECT * LIMIT 5 → Success! ✅
```

**Files Changed**:
- `src/config/custom-instructions.ts` (lines 247-252)

---

### **Enhancement 3: API Key Modal Spam Fix**
**Problem**: Console.log was in render function, causing hundreds/thousands of log messages on every keystroke. Made debugging impossible and potentially caused performance issues.

**Solution**: Moved console.log into useEffect (`ApiKeyValidationModal.tsx:29-33`):
```typescript
// Before (BAD): Logs on every render
console.log('Modal opened');

// After (GOOD): Logs only when modal actually opens
React.useEffect(() => {
  if (isOpen) {
    console.log('Modal opened');
  }
}, [isOpen]);
```

**Impact**:
- Clean console output (no spam)
- Easier debugging
- Better performance

**Files Changed**:
- `src/components/ApiKeyValidationModal.tsx` (lines 29-33)

---

### **Enhancement 4: Diagnostic LIMIT Consistency**
**Problem**: Diagnostic queries used inconsistent LIMIT values (10, 100, or none).

**Solution**: Standardized all diagnostic queries to LIMIT 5 (`custom-instructions.ts:254-268`):
- Step 1: `SELECT * LIMIT 5` (was 10)
- Step 4: `SELECT AVG(column) LIMIT 5` (was unlimited)
- Step 5: All incremental tests use LIMIT 5

**Impact**:
- Consistent behavior across all diagnostics
- Safer (never loads too many rows)
- Faster (smaller result sets)

**Files Changed**:
- `src/config/custom-instructions.ts` (lines 254-268)

---

### **Enhancement 5: Reserved Keyword Column Handling (DEFAULT)**
**Problem**: Tables with columns named `DEFAULT` (a SQL reserved keyword) were causing multiple critical errors:
- **Sample Collection Error**: `SELECT clause cannot contain DEFAULT clause` when querying tables with reservoir sampling
- **AI Query Failures**: `Unimplemented expression class` errors when AI generated queries with `CASE WHEN DEFAULT = TRUE`
- **Parser Confusion**: DuckDB-Wasm parser interpreted column name `DEFAULT` as the SQL keyword even in quoted contexts

**Root Cause Discovery Process**:
1. Initial hypothesis: DEFAULT clauses in table schema (from auto_detect during CSV import)
2. Attempted fixes: Tried `ALTER TABLE DROP DEFAULT` and table recreation - didn't work
3. Added verification: Confirmed NO DEFAULT clauses existed in schema
4. Breakthrough: Debug logging revealed column literally named "DEFAULT" in SELECT list
5. True cause: Reserved keyword `DEFAULT` used as column name without proper handling

**Solution - Two-Part Fix**:

**Part 1: Quote Column Names in Queries** (`src/utils/collectSampleRows.ts:14-44`)
- Modified `buildFormattedSelectClause()` to quote ALL column names with double quotes
- Before: `SELECT AGE, JOB, DEFAULT, BALANCE...`
- After: `SELECT "AGE", "JOB", "DEFAULT", "BALANCE"...`
- This allows sample row collection to work with reserved keyword columns

**Part 2: Auto-Rename During Import** (`src/components/DataSourcesPanel.tsx:255-275, 453-473`)
- Automatically detects if imported table has a `DEFAULT` column
- Renames `DEFAULT` → `DEFAULT_FLAG` using `ALTER TABLE RENAME COLUMN`
- Prevents all downstream parser issues with AI-generated queries
- Applies to both file picker imports and drag-and-drop imports

**Impact**:
- ✅ Sample row collection works for all tables (no more "SELECT clause cannot contain DEFAULT clause")
- ✅ AI queries execute successfully (no more "Unimplemented expression class")
- ✅ Zero user intervention required (automatic rename during import)
- ✅ Prevents future issues with other reserved keyword columns

**Technical Details**:
- **Detection**: Uses `DESCRIBE tableName` to enumerate columns reliably
- **Renaming**: Uses quoted column name syntax: `ALTER TABLE t RENAME COLUMN "DEFAULT" TO DEFAULT_FLAG`
- **Logging**: Console logs show rename operation for debugging
- **Error Handling**: Non-critical - import succeeds even if rename fails

**Files Changed**:
- `src/utils/collectSampleRows.ts` (lines 14-44) - Quote all column names
- `src/components/DataSourcesPanel.tsx` (lines 255-275) - Auto-rename on file picker import
- `src/components/DataSourcesPanel.tsx` (lines 453-473) - Auto-rename on drag-and-drop import
- `src/components/CustomQueryControls.tsx` (lines 78-82, 105-109) - Added debug logging for AI query execution

**Lessons Learned**:
- ❌ Don't trust error messages at face value - "DEFAULT clause" error wasn't about DEFAULT clauses in schema
- ✅ Add debug logging early to see actual queries being executed
- ✅ Reserved keywords as column names cause cascading parser issues - rename them proactively
- ✅ DuckDB-Wasm parser is stricter than standard DuckDB - quote all identifiers in dynamic queries

**Related Issues**:
- This pattern can be extended to handle other reserved keywords (SELECT, WHERE, FROM, etc.)
- Consider adding a reserved keyword check/rename system for all common SQL keywords

---

## Current Implementation Overview

### Core Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Database**: DuckDB-Wasm 1.30.1-dev2.0 (in-browser SQL engine)
- **AI Integration**: @sqlrooms/ai package with custom tools and instructions
- **State Management**: Zustand with persistence
- **UI Components**: @sqlrooms/ui package with react-mosaic-component layout
- **File Processing**: JSZip for database exports, smart delimiter detection for imports

### Query Processing Flow
1. **User Input** → Natural language question in chat interface
2. **AI Processing** → LLM receives question + schema + custom instructions
3. **Tool Selection** → AI chooses appropriate tool (query, chart, etc.)
4. **Tool Execution** → Agent executes tools iteratively (max 15 steps per question)
5. **SQL Generation** → LLM generates SQL query with reasoning
6. **Execution** → SQL queries run in DuckDB via custom DDL-enabled query tool
7. **Result Sharing** → First 100 rows automatically shared with LLM (`numberOfRowsToShareWithLLM: 100`)
8. **Display** → Results shown in expandable boxes with row count and SQL query visible

**Tool Call Limits** (`src/store.ts:120`):
- **maxSteps: 15** - Maximum tool execution iterations per question (default is 5, increased to 15 for complex analyses)
- **Behavior when limit reached**: Agent stops execution, finishReason becomes "max-steps", partial results returned to user
- **Retry Strategy**: Enhanced error recovery system with progressive simplification strategy (uses all 15 steps effectively)

### AI Schema & Instructions System

**CURRENT IMPLEMENTATION**: On-demand DESCRIBE approach (✅ **60% token savings**)

**Location**: `src/config/custom-instructions.ts:303-330` (getCustomInstructions function)

**Schema Optimization Strategy**:
- ❌ **OLD**: Sent full 40KB schema YAML (columns + 10 sample rows per table) = ~10K tokens
- ✅ **NEW**: Send table list only + instruct AI to run DESCRIBE for schema discovery = ~4K tokens
- **Result**: 60% token reduction per query (10K → 4K tokens)

**What Gets Sent Now (Total: ~16KB / 4K tokens)**:

```
┌─ PART 1: Base Instructions (~8KB) ─────────────────┐
│ • DuckDB SQL syntax rules                          │
│ • Tool usage guidelines                            │
│ • SELECT safety rules (LIMIT enforcement)          │
│ • Error recovery strategy (15 steps)               │
│ • Query safety best practices                      │
└────────────────────────────────────────────────────┘

┌─ PART 2: Table List (~200 bytes) ← LIGHTWEIGHT ───┐
│ AVAILABLE TABLES:                                   │
│ - main.BANK_UNQ_1M (1,000,000 rows)                │
│ - main.SALES_DATA (45,823 rows)                    │
│                                                     │
│ SCHEMA DISCOVERY:                                   │
│ - To see table schema: DESCRIBE tablename;         │
│ - Explore schema before complex queries            │
└────────────────────────────────────────────────────┘

┌─ PART 3: Chart Tool Examples (~8KB) ───────────────┐
│ • Vega Lite specifications                          │
│ • Bar/Line/Scatter chart examples                   │
│ • Sizing guidelines by chart type                   │
└────────────────────────────────────────────────────┘
```

**How On-Demand Schema Works**:
1. AI sees table names + row counts only (minimal context)
2. When AI needs schema: runs `DESCRIBE tablename;` via executeQuery tool
3. Gets fresh schema: columns, types, constraints
4. Uses schema to write accurate queries
5. **Benefit**: Only pays for schema when actually needed

**Token Cost Per Query** (NEW):
- System prompt (instructions + table list): ~4K tokens (down from 10K)
- Conversation history: ~2K tokens per Q&A pair
- User message: ~100-500 tokens
- **Savings**: 6K tokens per query = 60% reduction

**Code Flow**:
```
User types message
  ↓
CustomQueryControls.tsx: runAnalysis()
  ↓
AiSlice.ts:340: await runAnalysis({ tableSchemas: get().db.tables, ... })
  ↓
analysis.ts:187: createAssistant({ instructions: getInstructions(tableSchemas) })
  ↓
custom-instructions.ts:303-330: getCustomInstructions(tables)
  ↓
  - Generate table list with row counts [~200 bytes]
  - Add DESCRIBE instructions for schema discovery
  - Concatenate with base instructions [8KB]
  - Add chart examples [8KB]
  ↓
Returns 16KB system prompt → Sent to LLM (60% savings)
```

### Token Usage Tracking

**Status**: ⏸️ **PAUSED** (requires 4-6 hours for proper implementation)

**Documentation**: See `reference/TOKEN_USAGE_MASTER_GUIDE.md` (17KB consolidated guide)

**What Was Attempted**:
- UI components for displaying token counts (prompt/completion/total/reasoning)
- Debug logging in `patches/@sqlrooms+ai+0.24.20.patch`
- Tested across providers: OpenAI ❌, Google ❌, Anthropic (not tested)
- **Root Cause**: `@openassistant/core` wrapper doesn't expose `usage` field from Vercel AI SDK

**Why It's Blocked**:
- Vercel AI SDK DOES return `result.usage` promise with token data
- Our wrapper (`@openassistant/core`) only returns `{streamMessage, messages}` - no usage exposure
- Need to: (a) modify wrapper source, (b) bypass wrapper entirely, or (c) implement proxy pattern

**Master Guide Contains**:
- Complete forensic analysis of both AI coder attempts
- AI Coder A evaluation (B- grade) + delegation strategy
- 3 viable implementation approaches with steps
- Token cost calculation formulas per provider
- Review checklist for future work

**Next Steps** (when resumed):
1. Inspect `node_modules/@openassistant/core/` source code
2. Find where it calls Vercel AI SDK's `streamText()`
3. Check if wrapper awaits `result.usage` promise
4. Implement Approach 1, 2, or 3 from master guide
5. Test across all providers before UI implementation

### Enhanced Error Recovery System

**Location**: `src/config/custom-instructions.ts` + `patches/@sqlrooms+ai+0.24.20.patch`

**Purpose**: Aggressive retry behavior that uses all 15 tool execution steps when encountering DuckDB-Wasm "Unimplemented" errors, preventing premature failure.

#### Core Enhancements

**1. Tool Execution Budget (lines 119-124)**
- **CRITICAL directive**: "When debugging errors, USE ALL AVAILABLE STEPS - don't give up early!"
- **Progressive debugging**: If same error appears twice, try COMPLETELY DIFFERENT approach
- **Threshold**: Only report failure after exhausting 5+ different solutions

**2. CTE Complexity Pitfall #8 (lines 162-170)**
- **Pattern**: Complex CTEs with multiple UNION ALL references
- **Error**: "Unimplemented expression class" or "Not implemented"
- **4-Step Fallback Strategy**:
  - Attempt 1: Simplify CTE structure (fewer nested levels)
  - Attempt 2: Remove UNION ALL, use separate simple queries
  - Attempt 3: Replace CTEs with direct GROUP BY aggregations
  - Attempt 4: Run each aggregation as separate query, combine results

**3. SELECT Query Safety Rules (lines 172-242)**

Critical protections against memory overload and wasted API tokens:

**Key Rules**:
1. **NEVER run SELECT without LIMIT** on tables with 1000+ rows (row counts visible in schema)
2. **When user says "Create Data Mart/Summary"** → Use CREATE TABLE, not just SELECT
3. **GROUP BY on large tables** → Either CREATE TABLE or add LIMIT 100
4. **Diagnostic queries** → Always use LIMIT 5 (not unlimited)
5. **Memory awareness** → Consider row counts before querying

**Examples**:
```sql
-- ❌ BAD: Loads 250K rows into memory
SELECT segment, COUNT(*) FROM customers GROUP BY segment

-- ✅ GOOD: Creates persistent table
CREATE TABLE customer_segments AS 
SELECT segment, COUNT(*) FROM customers GROUP BY segment

-- ✅ ALSO OK: Just wants to see sample
SELECT segment, COUNT(*) FROM customers GROUP BY segment LIMIT 100

-- ❌ BAD: Tries to load 1M rows
SELECT * FROM transactions

-- ✅ GOOD: Safe sample
SELECT * FROM transactions LIMIT 5
```

**4. Same Error Twice Strategy (lines 247-252)**

Prevents LLM from repeatedly trying same failed approach:

```
If you get the SAME error message 2 times in a row:
→ STOP trying similar approaches
→ Try COMPLETELY DIFFERENT strategy:
   - Abandon UNION ALL → Try separate simple queries
   - Abandon window functions → Try subqueries or GROUP BY
   - Abandon complex CTEs → Try direct queries
   - Abandon aggregations entirely → SELECT raw data with LIMIT 5
```

**5. Diagnostic Strategy for Persistent Errors (lines 254-268)**

Progressive simplification approach when queries fail repeatedly:

```
Step 1: SELECT * FROM table_name LIMIT 5
        → Can we even read the table? Check for table corruption

Step 2: SELECT COUNT(*) FROM table_name
        → Does simplest aggregation work?

Step 3: SUMMARIZE table_name
        → Does DuckDB's summary function work?

Step 4: SELECT AVG(single_column) FROM table_name LIMIT 5
        → Test individual aggregation functions one by one

Step 5: Add one feature at a time (WHERE, then GROUP BY, then ORDER BY)
        → Build complexity gradually to find what breaks (use LIMIT 5)
```

**Decision Rules**:
- If Steps 1-3 all fail → Table might be corrupted, try recreating it differently
- If Step 4 fails on specific column → Column type incompatible, try different column
- If complex query fails but simple ones work → Break complex query into multiple simple queries
- Only report as impossible after trying 5+ DIFFERENT approaches with this strategy

#### Patch Integration

**File**: `patches/@sqlrooms+ai+0.24.20.patch`
- Enhances the `@sqlrooms/ai` package's error handling instructions
- Applied automatically via `patch-package` on `npm install`
- Ensures error handling guidance is consistent with custom instructions

#### Real-World Examples

**Example 1: Error Recovery with Progressive Simplification**

**Scenario**: LLM generates complex UNION ALL query with CTEs, gets "Unimplemented expression class" error

**Before Enhancement**:
- Attempt 1: Try simplified CTE → Same error
- **Stops** after 2-3 attempts, reports failure

**After Enhancement**:
- Attempt 1: Try simplified CTE → Same error
- Attempt 2: Remove UNION ALL → Same error (2x same error triggers strategy change!)
- Attempt 3: Try SELECT * LIMIT 5 → Works (table is readable)
- Attempt 4: Try SELECT COUNT(*) → Works (aggregation possible)
- Attempt 5: Try SUMMARIZE → Works (gets full summary)
- Attempt 6: Try AVG on each column individually → Finds problematic column
- Attempt 7: Rewrite query avoiding that column → **Success!**

**Result**: Uses 7 of 15 steps to find solution instead of giving up early

**Example 2: SELECT Query Safety in Action**

**Scenario**: User asks "Summarize customer segments" on 250K row table

**Before Enhancement**:
```sql
-- LLM generates:
SELECT segment, COUNT(*), AVG(balance) 
FROM customers GROUP BY segment
-- Loads 250K rows into memory, only returns summary (50 rows)
-- Wastes memory, slows browser, increases API costs
```

**After Enhancement**:
```sql
-- LLM generates:
CREATE TABLE customer_segments AS 
SELECT segment, COUNT(*), AVG(balance) 
FROM customers GROUP BY segment
-- Creates persistent table, efficient, reusable
-- User can query it later without re-processing 250K rows
```

**Result**: Smarter query strategy, better performance, persistent results

#### Console Monitoring

```
🔍 [DDL QUERY TOOL] Executing query with reasoning: ...
❌ [DDL QUERY TOOL] Query execution failed: Unimplemented expression class
🔍 [DDL QUERY TOOL] Trying diagnostic Step 1: SELECT * FROM table LIMIT 10
✅ [DDL QUERY TOOL] Query executed successfully
🔍 [DDL QUERY TOOL] Trying diagnostic Step 2: SELECT COUNT(*) FROM table
✅ [DDL QUERY TOOL] Query executed successfully
...
```

**Status**: ✅ Active - LLM now attempts multiple approaches using all available steps before reporting failure

### Custom Tools Implementation

**Location**: `src/store.ts` - Custom tools override default SQLRooms tools

#### 1. **Query Tool** (DDL-enabled custom implementation)
- **File**: `src/tools/query-tool.ts` + `src/config/custom-instructions.ts`
- **Purpose**: SQL execution with CREATE/DROP/ALTER table permissions
- **Key Features**: 
  - Allows DDL operations (CREATE, DROP, ALTER TABLE)
  - Allows DML operations (INSERT, UPDATE, DELETE)
  - Custom safety instructions for division by zero handling
- **Parameters**: `sqlQuery`, `reasoning`
- **Returns**: Query results with success/error status

#### 2. **Chart Tool** (Vega Lite visualization - CURRENT)
- **Status**: ✅ **ACTIVE** - Currently using Vega Lite for all visualizations
- **Purpose**: Creates declarative JSON-based charts using Vega Lite specification
- **Tool**: `createVegaChartTool()` from `@sqlrooms/vega` package with custom wrapper
- **Features**:
  - Browser-side rendering (no external API calls)
  - Supports all common chart types (bar, line, scatter, histogram, pie, etc.)
  - Interactive charts with tooltips and zoom
  - Dual-axis charts with independent scales
- **Parameters**:
  - `sqlQuery` (required): SQL query to fetch chart data
  - `vegaLiteSpec` (required): Vega Lite JSON specification
  - `reasoning` (optional): Explanation of chart choice - auto-filled if missing
- **Returns**: Interactive chart rendered in browser
- **Custom Modifications** (`src/store.ts:218-236`):
  - **Optional Reasoning Parameter**: Modified schema to make `reasoning` optional with default value
  - **Auto-Fill Wrapper**: If LLM omits reasoning, automatically adds: "Visualization created based on query results"
  - **Why Modified**: LLMs sometimes omit the reasoning parameter despite instructions, causing validation errors
- **Chart Sizing Requirements** (`src/config/custom-instructions.ts:294-316`):
  - **ALWAYS REQUIRED**: Every vegaLiteSpec must include `width` and `height` properties
  - **Default dimensions**: width: 500, height: 300 (when unsure)
  - **Bar charts**: 400-900 width based on category count, height: 300-400
  - **Line charts**: 600-800 width for time series, height: 300-400
  - **Scatter plots**: 500-600 width, height: 400-500
  - **Dual-axis charts**: 600-700 width, height: 350-400
  - **Why enforced**: Charts without dimensions may render incorrectly or be too small

#### 2b. **Python Chart Tool** (CURRENTLY DISABLED - Will be re-enabled)
- **Status**: ⏸️ **DISABLED** - Code exists but tool not registered in store
- **Component**: `src/components/PythonChartResult.tsx` (preserved for future use)
- **Reason for Disabling**: Pending security implementation for FastAPI endpoint
- **Future Plans**: Will be re-enabled once endpoint security (authentication, rate limiting, sandboxing) is properly configured
- **Previous Implementation**:
  - FastAPI Code Interpreter endpoint: `/generate_plot-apk`
  - Bearer token authentication via `VITE_PYTHON_CHARTS_API_KEY`
  - Libraries: matplotlib, numpy, pandas, seaborn
  - Auto-cleanup: Plots deleted after timeout
- **Note**: All code and components are preserved and ready for re-activation

#### 3. **Echo Tool** (testing utility)
- **Component**: `src/components/EchoToolResult.tsx`
- **Purpose**: Simple text echoing for testing
- **Parameters**: `text`

## File Import System

**Location**: `src/components/DataSourcesPanel.tsx`

### Supported Formats
- **CSV** (`.csv`) - Uses DuckDB's default auto-detection (no explicit delimiter set)
- **TSV** (`.tsv`) - Explicitly sets `delim: '\t'`
- **Pipe-delimited** (`.pipe`, `.psv`) - Explicitly sets `delim: '|'`
- **Text files** (`.txt`) - Smart content analysis to detect delimiter type
- **Parquet** (`.parquet`) - Columnar format (no delimiter needed)
- **JSON** (`.json`) - Structured data (no delimiter needed)

### Smart Delimiter Detection Logic
**For .txt files**: Content analysis on first line to detect delimiter type
```typescript
const pipeCount = (firstLine.match(/\|/g) || []).length;
const tabCount = (firstLine.match(/\t/g) || []).length;  
const commaCount = (firstLine.match(/,/g) || []).length;

// Priority: Pipes > Tabs > Commas
if (pipeCount > 0) use delim='|'
else if (tabCount > 0) use delim='\t'  
else if (commaCount > 0) use delim=','
else use read_csv with auto_detect
```

### DuckDB Integration by File Type
**Explicit Delimiter Files:**
- **`.pipe`, `.psv`**: `{ method: 'read_csv', delim: '|', auto_detect: true, sample_size: -1 }`
- **`.tsv`**: `{ method: 'read_csv', delim: '\t', auto_detect: true, sample_size: -1 }`

**Auto-Detection Files:**
- **`.csv`**: No `loadOptions` set → Uses DuckDB's built-in auto-detection
- **`.txt`**: Content analysis → Sets appropriate `delim` based on detected delimiter

**Non-Delimiter Files:**
- **`.parquet`**: Uses `read_parquet` (handled by DuckDB auto-detection)
- **`.json`**: Uses `read_json` (handled by DuckDB auto-detection)

**Critical Notes:**
- Parameter name is `delim` (NOT `delimiter`) 
- Always forces `method: 'read_csv'` for .txt files to avoid "no extension" errors
- Fallback for .txt files: `read_csv` with `auto_detect: true` if no delimiter detected

### Import Flow
1. **File Drop** → FileDropzone accepts file
2. **Extension Check** → Determines file type by extension
3. **Content Analysis** → For .txt files, examines first line for delimiters
4. **Options Building** → Constructs `loadOptions` with appropriate `delim` parameter
5. **DuckDB Load** → `connector.loadFile(file, tableName, loadOptions)`
6. **Table Creation** → Automatic schema detection and table creation
7. **UI Update** → Toast notification and table schema refresh

## Database Export System

**Location**: `src/utils/exportDatabase.ts`

### Export Format: Parquet-based ZIP
**Why Parquet**: 80-90% smaller than CSV, 10x faster loading, native DuckDB support

### Export Process
1. **Table Discovery** → Query `information_schema.tables` for all tables
2. **Parquet Generation** → `COPY table TO 'file.parquet' (FORMAT PARQUET)` for each table
3. **Schema Extraction** → Generate CREATE TABLE statements from `information_schema.columns`
4. **ZIP Creation** → JSZip with maximum compression (level 9)
5. **Documentation** → Auto-generated README.md with Jupyter/FastAPI examples
6. **Download** → Browser blob download with unique timestamp filename
7. **Cleanup** → Remove temporary files from DuckDB virtual filesystem

### Failed Approaches (Historical Context)
**For future AI coders**: These methods were attempted but failed:
- **`db.save()` method**: Does not exist in DuckDB-Wasm 1.30.x versions
- **`connection.export()` method**: Does not exist in current DuckDB-Wasm
- **`copyFileToBuffer()` for .duckdb files**: Returns 1-byte empty buffers
- **`EXPORT DATABASE` command**: Creates directory structure, not single file
- **`ATTACH` + `COPY FROM DATABASE`**: File extraction still fails with generic exceptions
- **SQL dump approach**: Rejected by user - "beats my whole purpose"

### Current ZIP Contents
```
sqlrooms_database_TIMESTAMP.zip
├── schema.sql              # CREATE TABLE statements
├── table1.parquet         # Compressed table data
├── table2.parquet         # Compressed table data  
└── README.md              # Usage instructions
```

### File Size Benefits
- **200MB CSV** → ~20-40MB Parquet → ~15-30MB ZIP
- **500MB CSV** → ~50-100MB Parquet → ~35-70MB ZIP
- **Total compression**: ~85-90% size reduction vs CSV exports

## Table Export System

**Location**: `src/utils/exportTable.ts` + `src/components/TableExportModal.tsx` + `src/components/TableExportButton.tsx`

### 🎯 **Overview**
Individual table export system that allows users to export specific tables in multiple formats. Complements the database export by providing granular control over single table exports without ZIP packaging.

### 🏗️ **Architecture Components**

#### 1. **Core Export Utility** (`src/utils/exportTable.ts`)
- **Purpose**: Single table export with format-specific handling
- **Formats**: CSV (comma), Pipe-delimited (TXT), Parquet (binary)
- **No Fallback**: Clean failure handling without format fallback complexity
- **Direct Download**: Browser download without ZIP wrapper

#### 2. **Export Modal** (`src/components/TableExportModal.tsx`)
- **Design**: Compact 400px modal with dropdown + radio buttons
- **Table Selection**: Dropdown showing `tablename (rowcount rows)`
- **Format Selection**: Radio buttons for 3 export formats
- **Loading States**: Table loading + export progress indicators

#### 3. **Export Button** (`src/components/TableExportButton.tsx`)
- **Placement**: Above "Download Database" button in DataSourcesPanel
- **Icon**: Table icon (distinct from Download icon)
- **Integration**: Toast notifications + error handling

### ⚡ **Export Process Flow**
1. **Table Discovery** → `getAvailableTables()` queries `information_schema.tables`
2. **Format Selection** → User chooses CSV/Pipe/Parquet via radio buttons
3. **Export Command** → DuckDB `COPY table TO 'file.format'` with format-specific options
4. **File Extraction** → `copyFileToBuffer()` gets generated file
5. **Direct Download** → Browser blob download with timestamped filename
6. **Cleanup** → `dropFile()` removes temporary files from DuckDB

### 📋 **Export Formats & Commands**

#### **CSV Format**
```sql
COPY tablename TO 'tablename_timestamp.csv' (FORMAT CSV, HEADER)
```
- **Output**: `tablename_2025-09-24T12-30-00.csv`
- **MIME Type**: `text/plain`
- **Use Case**: Standard spreadsheet compatibility

#### **Pipe-Delimited Format**
```sql
COPY tablename TO 'tablename_timestamp.txt' (FORMAT CSV, DELIMITER '|', HEADER)
```
- **Output**: `tablename_2025-09-24T12-30-00.txt`
- **MIME Type**: `text/plain`
- **Use Case**: Alternative delimiter for data with commas

#### **Parquet Format**
```sql
COPY tablename TO 'tablename_timestamp.parquet' (FORMAT PARQUET)
```
- **Output**: `tablename_2025-09-24T12-30-00.parquet`
- **MIME Type**: `application/octet-stream`
- **Use Case**: Efficient columnar format for analytics

### 🎮 **User Interface Design**

#### **Button Layout in DataSourcesPanel**
```
┌── Export Controls ──────────┐
│ [📊 Export Table        ] │  ← NEW: Individual table export
│ [💾 Download Database   ] │  ← Existing: Full database export
└─────────────────────────────┘
```

#### **Modal Interface**
```
┌─ Export Table ──────────────── ✕ ─┐
│ Export a single table in your     │
│ preferred format.                 │
│                                   │
│ Table    [earthquakes (1000 rows)▼]│
│                                   │
│ Format   ◉ CSV (Comma-separated)   │
│          ○ Pipe-delimited (TXT)    │
│          ○ Parquet (Binary)        │
│                                   │
│              [Cancel] [Export]     │
└────────────────────────────────────┘
```

### 🔧 **Technical Implementation Details**

#### **Table Information Query**
```sql
SELECT
  table_name as name,
  COALESCE((
    SELECT COUNT(*)
    FROM information_schema.tables t2
    WHERE t2.table_name = t1.table_name
    AND t2.table_schema = 'main'
  ), 0) as estimated_rows
FROM information_schema.tables t1
WHERE table_schema = 'main'
AND table_type = 'BASE TABLE'
ORDER BY table_name
```

#### **Error Handling Strategy**
- **No Fallback**: Each format fails cleanly without automatic fallback
- **User Choice**: Users can manually retry with different format
- **Clear Messages**: Specific error messages via toast notifications
- **Cleanup**: Automatic temporary file cleanup even on errors

#### **Performance Characteristics**
- **No Caching**: Fresh table list on each modal open (fast for 5-6 tables)
- **Background Processing**: Non-blocking UI during export
- **Memory Efficient**: Direct file streaming with immediate cleanup
- **Fast Loading**: Table list loads in milliseconds

### 📊 **Console Logging Pattern**
```typescript
// Table discovery
📋 [TABLE EXPORT] Getting available tables...
📊 [TABLE EXPORT] Found tables: [{name: 'earthquakes', rowCount: 1000}]

// Export process
🔄 [TABLE EXPORT] Exporting earthquakes as CSV...
📋 [TABLE EXPORT] Export command: COPY earthquakes TO 'earthquakes_2025-09-24.csv'
📋 [TABLE EXPORT] Extracting earthquakes_2025-09-24.csv...
✅ [TABLE EXPORT] earthquakes_2025-09-24.csv generated: 45234 bytes
📥 [TABLE EXPORT] Download started: earthquakes_2025-09-24.csv
🗑️ [TABLE EXPORT] Cleaned up: earthquakes_2025-09-24.csv

// Modal operations
🔄 [TABLE EXPORT MODAL] Loading available tables...
🔄 [TABLE EXPORT MODAL] Exporting earthquakes as csv
✅ [TABLE EXPORT MODAL] Export completed: earthquakes
📋 [TABLE EXPORT BUTTON] Opening export table modal
✅ [TABLE EXPORT BUTTON] Export completed: earthquakes (csv)
```

### 🎯 **Key Benefits**

#### **User Experience Benefits**
- **Granular Control**: Export specific tables without full database
- **Format Flexibility**: Choose optimal format for use case
- **Fast Downloads**: Direct files without ZIP overhead
- **Clear Interface**: Compact modal with obvious selections

#### **Technical Benefits**
- **Code Reuse**: Leverages existing DuckDB export patterns
- **Clean Architecture**: Modular components with clear separation
- **Extensible Design**: Easy to add new formats or multi-table selection
- **Consistent Patterns**: Follows existing modal and error handling patterns

#### **Performance Benefits**
- **Direct Export**: No intermediate ZIP creation step
- **Efficient Storage**: Format-specific optimizations (Parquet compression)
- **Responsive UI**: Non-blocking export with loading indicators
- **Memory Management**: Automatic cleanup prevents file accumulation

### 🚀 **Usage Workflow**
1. **Access**: Click "Export Table" button in Data Sources panel
2. **Select**: Choose table from dropdown (shows row counts for context)
3. **Format**: Pick CSV, Pipe-delimited (TXT), or Parquet via radio buttons
4. **Export**: Click Export button to start download
5. **Download**: File downloads directly with descriptive timestamp name
6. **Notification**: Toast confirms success or reports errors

### 📦 **File Structure**
```
src/
├── utils/
│   ├── exportDatabase.ts         # Existing - Full database export
│   └── exportTable.ts            # NEW - Single table export utilities
├── components/
│   ├── DataSourcesPanel.tsx      # Modified - Added TableExportButton
│   ├── TableExportButton.tsx     # NEW - Export button component
│   └── TableExportModal.tsx      # NEW - Table selection modal
```

### 🔗 **Integration Points**
- **DataSourcesPanel**: Export button placement above database export
- **Toast System**: Success/error notifications via existing useToast
- **DuckDB Integration**: Uses same connector patterns as database export
- **UI Components**: Leverages existing Button, Modal, Select components

## Python Chart Tool System

**Location**: `src/components/PythonChartResult.tsx`

### FastAPI Integration
- **Endpoint**: `/generate_plot-apk` (API key protected)
- **Authentication**: Bearer token using `VITE_PYTHON_CHARTS_API_KEY`
- **Libraries**: matplotlib, numpy, pandas, seaborn available
- **Auto-cleanup**: Plots deleted after 6 hours

### Chart Generation Flow
1. **LLM Code Generation** → AI writes Python code with reasoning
2. **FastAPI Execution** → Code runs in sandboxed Python environment
3. **Image Generation** → matplotlib saves plot as image file
4. **URL Return** → FastAPI returns image URL
5. **Display** → React component shows image with code and reasoning
6. **Cleanup** → Automatic deletion after timeout

### Component Features
- **Code Display**: Shows generated Python code in expandable section
- **Reasoning Display**: Shows LLM's explanation of the chart
- **Error Handling**: Displays Python execution errors
- **Interactive**: Click to expand/collapse code sections

## AI Tool Selection & Custom Instructions System

**Location**: `src/config/custom-instructions.ts` + `src/store.ts`

### How AI Agent Chooses Tools

#### Tool Selection Process
1. **AI receives tool descriptions** - Each tool has a `description` field explaining its purpose
2. **AI sees parameter schemas** - Zod schemas with descriptions define what inputs each tool expects  
3. **AI uses system instructions** - Custom instructions provide context and rules for tool selection
4. **AI analyzes user query** - Determines what the user wants to accomplish
5. **AI makes intelligent choice** - Selects most appropriate tool(s) based on all available information

#### Tool Description Examples
```typescript
// Query Tool Description
description: `A tool for running SQL queries on the database. 
Supports all SQL operations including:
- SELECT queries for data retrieval
- CREATE TABLE, DROP TABLE, ALTER TABLE (DDL operations)  
- INSERT, UPDATE, DELETE (DML operations)
Always explain what the query will do before executing destructive operations.`

// Chart Tool Description  
description: `FastAPI Code Interpreter to execute python code for charts and plots.
Features:
- Supports matplotlib, numpy, pandas
- Plot files auto-delete after 10 minutes
- Use for complex statistical plots and custom visualizations`
```

### Custom Instructions System

**Location**: `src/config/custom-instructions.ts`
- **Function**: `getCustomInstructions()` returns DDL/DML permissions (4062 chars total)
- **Key Features**:
  - Explicit CREATE/DROP/ALTER TABLE permissions
  - Safety guidelines for division by zero (CASE/COALESCE)
  - Clear DML operation permissions
  - Data quality best practices
- **Integration**: Called from `src/store.ts` in `getInstructions()`

### Tool-Specific Instructions

**Location**: `src/config/custom-instructions.ts` - `TOOL_SPECIFIC_INSTRUCTIONS`

```typescript
export const TOOL_SPECIFIC_INSTRUCTIONS = {
  query: `
    This tool supports all SQL operations. Be extra careful with DDL operations.
    Always explain what the query will do before executing it.
  `,
  
  chart: `
    This tool creates Python charts using matplotlib. 
    Always include proper imports and use plt.show() to generate the plot.
    Handle data edge cases gracefully in your Python code.
  `,
} as const;
```

### How to Guide AI Tool Selection

#### 1. Add Tool Selection Logic to System Instructions
```typescript
// In src/config/custom-instructions.ts
const customInstructions = `${defaultInstructions}

TOOL SELECTION GUIDELINES:
- Use 'query' tool for all SQL operations and data retrieval
- Use 'chart' tool ONLY for creating visualizations with Python/matplotlib
- If you have multiple charting tools available:
  * Use 'chart' (Python) for complex statistical plots and custom visualizations
  * Use 'vega_chart' (if available) for simple, quick charts
  * Prefer Python charts for advanced analytics and statistical plots
- Always explain your tool choice in the reasoning parameter`;
```

#### 2. Enhance Tool Descriptions for Better Selection
```typescript
// In src/store.ts - Make tool descriptions more explicit
customTools: {
  chart: {
    description: `PRIMARY CHARTING TOOL: FastAPI Code Interpreter for advanced Python visualizations.
    
    Use this tool for:
    - Complex statistical plots and analysis
    - Custom matplotlib/seaborn visualizations  
    - Advanced data transformations before plotting
    - Scientific and analytical charts
    
    Do NOT use for:
    - Data analysis without visualization
    - Simple text operations
    - Database queries`,
    // ... rest of tool definition
  }
}
```

#### 3. Multiple Chart Tools Example
```typescript
// If you add multiple charting tools
customTools: {
  // Primary charting tool
  chart: {
    description: `ADVANCED CHARTING TOOL: Use this for complex visualizations requiring Python libraries.
    Preferred for: Statistical analysis, complex data transformations, scientific visualizations`,
  },
  
  // Secondary charting tool  
  quick_chart: {
    description: `SIMPLE CHARTING TOOL: Use this for basic, quick visualizations.
    Preferred for: Simple bar charts, quick data overviews, basic scatter plots`,
  }
}
```

### Tool Selection Flow Architecture

```typescript
// In src/store.ts - AI slice configuration
...createAiSlice({
  // Custom instructions guide tool selection
  getInstructions: getCustomInstructions,
  
  // Custom tools with enhanced descriptions
  customTools: {
    query: { /* DDL-enabled query tool */ },
    chart: { /* Python chart tool */ },
    echo: { /* Testing tool */ },
    // Add more tools as needed
  }
})
```

### Current Tool Inventory

#### Available Tools (Current Deployment)
1. **Query Tool** (`query`) - DDL-enabled SQL execution
2. **Chart Tool** (`chart`) - ✅ Vega Lite visualizations (browser-side, no API calls)
3. **Echo Tool** (`echo`) - Simple text echoing for testing
4. **Debug Tools** (`debug_sql`, `debug_charts`) - Development utilities

#### Tools Temporarily Disabled
- **Python Chart Tool** - ⏸️ Disabled pending security implementation for FastAPI endpoint
- **Component preserved**: `src/components/PythonChartResult.tsx`
- **Will be re-enabled**: Once authentication, rate limiting, and sandboxing are configured

#### Tool Selection Criteria
- **Data Retrieval/Analysis** → Use `query` tool
- **Visualizations** → Use `chart` tool (Vega Lite - currently active)
- **Testing/Debugging** → Use `echo` or debug tools
- **Multiple Tools Available** → AI chooses based on descriptions + instructions

### CSS Styling System

**Location**: `src/index.css` + Tailwind CSS
- **Layout**: `react-mosaic-component` for resizable panes
- **Text Wrapping**: Custom CSS rules for proper text overflow handling
- **Table Styling**: `width: max-content` for natural table sizing
- **Responsive Design**: Tailwind utilities with custom overrides

#### Color Customizations (Darker Text for Better Readability)
- **Primary Color Override**: Changed from dark gray (`240 5.9% 10%`) to bright indigo (`239 84% 67%`)
  - Located in `:root` and `.dark` CSS variables
  - Makes primary buttons (Send, Database) show bright blue instead of black
- **Button Text Colors**:
  - Data Sources panel buttons: `#334155` (slate-700) - darker for better contrast
  - Quick prompt buttons: `hsl(239 84% 67%)` (indigo-500) - bright blue to stand out
  - Top menu buttons: Original slate colors maintained
  - Database button icon: White when selected (`bg-primary`)
- **Chat Content Text**:
  - Main text: `#475569` (slate-600) with `font-weight: 400`
  - Table text: `#1e293b` (slate-800) for better readability
  - Headings: `#0f172a` (slate-900) - very dark for emphasis
  - Explanation text: `#374151` (gray-700)
- **UI Elements**:
  - Session name display: `#334155` (slate-700)
  - Session dropdown items: `#334155` (slate-700)
  - Model selector dropdown: `#334155` (slate-700)
  - DATA SOURCES header: `#334155` (slate-700) with `font-size: 0.9rem`

#### Key CSS Fixes
- Text wrapping: `word-wrap: break-word !important`
- Table width: `width: max-content !important`
- Container overflow: `overflow-x: auto !important`
- Button targeting: Uses container-based selectors (e.g., `div.p-3.border-t.border-gray-200.space-y-2 button`)

### Configuration

- **Default Theme**: Light (changed from dark)
- **AI Model**: OpenAI GPT-4o-mini (configurable)
- **Result Sharing**: 100 rows shared with LLM (`numberOfRowsToShareWithLLM: 100`)
- **Package Versions**: 
  - `@sqlrooms/ai@0.24.20` (forced to prevent version conflicts)
  - `@duckdb/duckdb-wasm@1.30.1-dev2.0` (development version for latest features)
  - `jszip@3.10.1` (for database export functionality)
- **DuckDB Override**: Local `package.json` overrides main repo's `pnpm.overrides`

## API Key Management System

**Location**: `src/components/ApiKeyModal.tsx` + `src/components/ApiKeyButton.tsx` + `src/utils/apiKeyValidation.ts` + `src/store.ts`

### 🎯 **Overview**
Professional modal-based API key management system that replaces the previous single input approach. Provides secure, multi-provider key management with validation, visual feedback, and batch saving capabilities.

### 🏗️ **Architecture Components**

#### 1. **ApiKeyButton** (`src/components/ApiKeyButton.tsx`)
- **Purpose**: Compact status button in top menu showing "API Keys" with status icon
- **Visual Indicators**: Green check (configured), red/orange alert (missing/invalid)
- **Space Efficient**: Removed verbose status text to save menu space
- **Providers Managed**: OpenAI, Google Gemini, Anthropic Claude (DeepSeek removed)

#### 2. **ApiKeyModal** (`src/components/ApiKeyModal.tsx`)
- **Purpose**: Main modal interface for managing all provider keys
- **Features**:
  - Individual provider inputs with real-time validation
  - Batch saving with change detection
  - Clean, compact design without status counters
  - No tips section (UI is self-explanatory)
  - Keyboard shortcuts (Cmd/Ctrl + Enter to save, Escape to cancel)

#### 3. **ApiKeyInput** (`src/components/ApiKeyInput.tsx`)
- **Purpose**: Individual provider input component with validation
- **Features**:
  - Show/hide toggle for password visibility
  - Real-time validation with visual feedback (check/alert icons)
  - Provider-specific help links ("Get API Key" buttons)
  - Provider-specific placeholder text and validation rules

#### 4. **API Key Validation** (`src/utils/apiKeyValidation.ts`)
- **Purpose**: Comprehensive validation and security utilities
- **Provider-Specific Validation**:
  - **OpenAI**: Must start with `sk-` and be 20+ characters
  - **Google**: Must start with `AIza` and be 20+ characters
  - **Anthropic**: Must start with `sk-ant-` and be 20+ characters
- **Security Features**:
  - API key masking for console logs (`sk-abc...xyz123`)
  - Secure logging functions that never expose full keys
  - Provider display names and help URLs

### 🔐 **Storage & Security**

#### Storage Mechanism
- **Location**: Browser localStorage
- **Key**: `ai-example-app-state-storage`
- **Format**: JSON object containing app state
- **Persistence**: Keys survive browser restarts, page refreshes
- **Security**: Keys never transmitted except to respective APIs

#### Storage Structure
```json
{
  "apiKeys": {
    "openai": "sk-your-openai-key-here",
    "google": "AIza-your-google-key-here",
    "anthropic": "sk-ant-your-anthropic-key-here"
  },
  "config": { /* other app settings */ }
}
```

#### Security Features
- **Local-Only Storage**: API keys never sent to application servers
- **Masked Logging**: Console logs show `sk-abc...xyz123` format
- **Input Protection**: Password fields hide keys while typing
- **Validation**: Format validation prevents invalid keys
- **Secure Display**: Keys hidden by default with show/hide toggle

### 🎮 **User Interface**

#### Top Menu Button
```typescript
// Compact button showing just "API Keys" with status icon
<Button>
  <KeyIcon />
  <StatusIcon /> // Green check or red/orange alert
  <span>API Keys</span>
</Button>
```

#### Modal Interface
- **Clean Design**: No status counters or verbose text
- **3 Provider Inputs**: OpenAI, Google Gemini, Anthropic Claude
- **Real-Time Validation**: Immediate feedback with icons
- **Help Integration**: Direct links to provider API key pages
- **Batch Operations**: Save all changes at once

### ⚡ **Implementation Details**

#### Store Integration (`src/store.ts`)
```typescript
// Batch API key saving
setBatchApiKeys: (keys: Record<string, string>) => {
  console.log('🔑 [STORE] Batch setting API keys for providers:', Object.keys(keys));
  const currentKeys = get().apiKeys;
  const updatedKeys = { ...currentKeys };

  Object.entries(keys).forEach(([provider, key]) => {
    if (key && key.trim().length > 0) {
      updatedKeys[provider] = key.trim();
    } else {
      updatedKeys[provider] = undefined;
    }
  });

  set({ apiKeys: updatedKeys });
}
```

#### CustomSessionControls Integration
```typescript
// Modal state management
const [isApiKeyModalOpen, setIsApiKeyModalOpen] = React.useState(false);

// Replace single input with button + modal
<ApiKeyButton
  apiKeys={apiKeys}
  currentProvider={currentModelProvider}
  onClick={() => setIsApiKeyModalOpen(true)}
/>

<ApiKeyModal
  isOpen={isApiKeyModalOpen}
  onClose={() => setIsApiKeyModalOpen(false)}
  currentApiKeys={apiKeys}
  onSaveKeys={setBatchApiKeys}
/>
```

### 📋 **Console Logging**

#### Security-First Logging
All API key operations use secure logging that masks sensitive data:

```typescript
// Safe logging examples
🔑 [API KEY] Saved for openai: sk-abc...xyz123
🔑 [API KEY BUTTON] Opening API key modal
🔑 [API KEY STATUS] configured: 2/3, required: 2/3, currentProvider: openai
🔑 [STORE] Batch setting API keys for providers: ['openai', 'google']
```

#### Validation Feedback
```typescript
// Validation logging
⚠️ [API KEY MODAL] Save blocked - invalid keys for: ['google']
✅ [API KEY MODAL] Saving keys for providers: ['openai', 'anthropic']
🔄 [API KEY MODAL] Discarding changes
```

### 🎯 **Key Benefits**

#### UX Improvements
- **Space Efficient**: Compact "API Keys" button vs verbose status text
- **Professional**: Modal interface vs confusing single input
- **Clear Status**: Visual icons show configuration state at a glance
- **Batch Operations**: Manage all keys in one interface

#### Developer Experience
- **Secure Logging**: API keys automatically masked in all logs
- **Type Safety**: Full TypeScript support with provider type validation
- **Extensible**: Easy to add new providers with validation rules
- **Testable**: Modular components with clear separation of concerns

#### Security Enhancements
- **Format Validation**: Provider-specific key format checking
- **Masked Display**: Keys hidden by default with toggle option
- **Secure Storage**: localStorage with no server transmission
- **Audit Trail**: All operations logged securely for debugging

### 🔍 **How to View Stored Keys**
1. Open Browser DevTools (F12)
2. Application tab → Local Storage → `http://localhost:5175`
3. Find key: `ai-example-app-state-storage`
4. Look for `apiKeys` object in JSON data

### 📦 **File Structure**
```
src/
├── components/
│   ├── ApiKeyModal.tsx          # Main modal interface
│   ├── ApiKeyButton.tsx         # Top menu status button
│   ├── ApiKeyInput.tsx          # Individual provider inputs
│   └── CustomSessionControls.tsx # Integration point
├── utils/
│   └── apiKeyValidation.ts      # Validation & security utilities
└── store.ts                     # Batch saving & state management
```

### Environment Variables

**Required for local development:**
- **File**: `.env.local` (NOT `.env` - Vite requires `.env.local` for local development)
- **Variables**:
  - `VITE_OPENAI_API_KEY` - OpenAI API key for AI functionality (fallback)
  - `VITE_PYTHON_CHARTS_API_KEY` - API key for Python chart generation (Bearer auth)

**Note**: Use `.env.local` instead of `.env` for local development as Vite's environment variable loading works differently in development mode.

### File Structure

```
src/
├── store.ts                    # Main Zustand store with custom tools + API key management
├── config/
│   ├── custom-instructions.ts # DDL/DML permissions + tool selection guidance (4062 chars)
│   ├── quickPrompts.ts        # Starter prompts configuration
│   └── api.ts                # FastAPI endpoints + Bearer token auth
├── tools/
│   ├── query-tool.ts          # Custom DDL-enabled query tool with enhanced descriptions
│   └── index.ts              # Tool exports
├── components/
│   ├── AppHeader.tsx             # Main app header (bug report button removed)
│   ├── DataSourcesPanel.tsx      # File import with smart delimiter detection + export controls
│   ├── PythonChartResult.tsx     # Chart display component
│   ├── EchoToolResult.tsx        # Echo display component
│   ├── CustomSessionControls.tsx # Model selector + session controls + API key button
│   ├── CustomQueryControls.tsx   # Query input with starter prompts UI
│   ├── ApiKeyModal.tsx           # Main API key management modal
│   ├── ApiKeyButton.tsx          # Compact API key status button
│   ├── ApiKeyInput.tsx           # Individual provider key inputs
│   ├── TableExportButton.tsx     # Table export button component
│   ├── TableExportModal.tsx      # Table selection modal
│   └── MainView.tsx             # Main UI layout
├── utils/
│   ├── exportDatabase.ts     # Parquet-based ZIP export system (full database)
│   ├── exportTable.ts        # Individual table export utilities
│   └── apiKeyValidation.ts   # API key validation & security utilities
├── models.ts                 # LLM model configurations (OpenAI, Google, etc.)
└── index.css                 # Global styles + text wrapping fixes
```

## Critical Technical Notes for AI Coders

### DuckDB-Wasm API Gotchas
- **Parameter Names**: Use `delim` NOT `delimiter` for CSV delimiter
- **File Extraction**: `copyFileToBuffer()` fails for .duckdb files (returns 1-byte)
- **Method Availability**: `save()`, `export()` methods do not exist in 1.30.x
- **Auto-detection**: Always force `method: 'read_csv'` for .txt files
- **Version Issues**: Main repo forces 1.30.0, override in local package.json

### Import System Edge Cases
**File Extension Handling:**
- **`.csv`**: Relies on DuckDB's default behavior (no custom `loadOptions`)
- **`.pipe`, `.psv`**: Always explicit `delim: '|'` (no content analysis needed)
- **`.tsv`**: Always explicit `delim: '\t'` (no content analysis needed)  
- **`.txt`**: Content analysis required → Falls back to `read_csv` with `auto_detect` if no delimiter found

**Error Handling:**
- **Content analysis failures**: Always fallback to `read_csv` method for .txt files
- **Generic "no extension" errors**: Fixed by explicit `method: 'read_csv'` specification
- **Empty delimiter detection**: Uses `read_csv` with `auto_detect: true` as last resort

### Export System Architecture Decision
- **Rejected approaches**: SQL dump, single .duckdb file extraction
- **Chosen approach**: Parquet + ZIP for 85-90% compression
- **File format priority**: Parquet > CSV fallback for maximum compatibility
- **Documentation**: Auto-generated README.md with Jupyter/FastAPI examples

### API Key Management Gotchas
- **Storage Key**: `ai-example-app-state-storage` (not `apiKeys` directly)
- **Provider Names**: Use exact provider names (`openai`, `google`, `anthropic`) - case sensitive
- **Modal State**: Uses React useState for modal open/close state management
- **Batch Saving**: All keys saved together using `setBatchApiKeys()` function
- **Validation**: Provider-specific format validation before saving
- **Security**: Keys masked in all console logs, stored locally only
- **Compact UI**: Status button shows just "API Keys" with color-coded status icon
- **Provider Subset**: Only shows OpenAI, Google, Anthropic (DeepSeek removed)
- **Environment Fallback**: `VITE_OPENAI_API_KEY` used as fallback if no stored key

### Tool Selection Gotchas
- **Tool Descriptions**: Must be clear and explicit about when to use each tool
- **Parameter Descriptions**: Zod schema `.describe()` fields are crucial for AI understanding
- **System Instructions**: Custom instructions in `getCustomInstructions()` override default behavior
- **Tool Override**: Custom tools in `customTools` override default SQLRooms tools
- **Multiple Tools**: AI chooses based on descriptions + instructions + user query context
- **Reasoning Parameter**: Always include `reasoning` parameter to explain tool choice

### Model Selection Gotchas & Custom Implementation
- **⚠️ CRITICAL FIX**: Package ModelSelector from `@sqlrooms/ai` does NOT update baseURL when switching models
- **Custom Implementation**: `src/components/ModelSelector.tsx` - Local ModelSelector with baseURL update logic
- **baseURL Update**: When model changes, must call BOTH `setAiModel()` AND `setBaseUrl()` from `PROVIDER_DEFAULT_BASE_URLS`
- **Import Override**: `CustomSessionControls.tsx` imports local ModelSelector instead of package version
- **Why Necessary**: Package ModelSelector only calls `setAiModel()`, causing wrong API endpoints (e.g., Anthropic uses OpenAI proxy)
- **Default Model Override**: useEffect that sets default model must only run for NEW sessions, not user selections
- **Session ID Tracking**: Use Set of processed session IDs to prevent overriding user model choices
- **Console Debugging**: Model selection issues show as working selection immediately overridden by useEffect

### Schema Awareness Gotchas
- **Automatic Refresh**: Schema refreshes only after `refreshTableSchemas()` is called
- **Cache Dependency**: AI gets schemas from `store.db.tables` cache, not directly from DuckDB
- **File Addition**: Schema refresh happens automatically after file drop in DataSourcesPanel
- **Manual Refresh**: Can manually refresh schemas via `db.refreshTableSchemas()` if needed
- **Schema Format**: Schema sent to AI is JSON.stringify() of DataTable[] array
- **Complete Metadata**: Includes table names, column types, row counts, file names, SQL definitions
- **View Support**: Distinguishes between tables and views with `isView` flag
- **Real-time Updates**: Every AI question gets the latest cached schema

### Supported AI Models & Providers

**Location**: `src/models.ts`

#### Active Models (Shown in UI)
- **OpenAI**: `gpt-4o-mini`, `gpt-4.1-nano`
- **Google**: `gemini-2.0-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-flash`

#### Dormant Models (Available but not shown)
- **OpenAI**: `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o`, `gpt-4`, `gpt-5`
- **Anthropic**: `claude-3-5-sonnet`, `claude-3-5-haiku`
- **Google**: `gemini-2.0-pro-exp-02-05`, `gemini-1.5-pro`, `gemini-1.5-flash`
- **DeepSeek**: `deepseek-chat`
- **Ollama**: `qwen3:32b`, `qwen3`, `custom`

#### Provider Configuration
```typescript
export const PROVIDER_DEFAULT_BASE_URLS = {
  openai: '/api/openai-proxy',  // Routed through Vercel serverless proxy to avoid CORS
  anthropic: 'https://api.anthropic.com/v1',  // Direct to Anthropic API
  google: 'https://generativelanguage.googleapis.com/v1beta',  // Direct to Google API
  deepseek: 'https://api.deepseek.com/v1',
  ollama: 'http://localhost:11434/api',
} as const;
```

**⚠️ CRITICAL**: OpenAI uses proxy (`/api/openai-proxy`) while Anthropic and Google go direct. This is why custom ModelSelector is needed to properly update baseURL on provider switch.

## Sample Rows Enhancement System

**Location**: `src/hooks/useSampleRowsEnhancement.ts` + `src/utils/collectSampleRows.ts` + `src/config/custom-instructions.ts`

### 🎯 **Overview**
The sample rows enhancement system automatically collects up to 10 representative rows from each table and includes them in the AI's schema awareness. This provides the AI with **actual data patterns**, not just table structure, enabling more accurate query suggestions and analysis.

### 🏗️ **Implementation Architecture**

#### 1. Enhancement Hook (`useSampleRowsEnhancement.ts`)
- **Trigger**: React `useEffect` automatically runs when `db.tables` state changes
- **Logic**: Only enhances tables that don't already have sample rows (avoids redundant work)
- **Storage**: Stores enriched tables in `window.__enrichedTables` for global access
- **Performance**: Non-blocking async operation, doesn't freeze UI
- **Integration**: Used in `DataSourcesPanel.tsx` component

#### 2. Sample Collection (`collectSampleRows.ts`)
- **Primary Method**: DuckDB reservoir sampling (`USING SAMPLE 10`) - provides random representative data
- **Fallback Method**: Simple `LIMIT 10` if reservoir sampling fails (for compatibility)
- **Data Sanitization**: Automatically converts BigInt values to numbers for JSON/YAML compatibility
- **Performance Monitoring**: Detailed timing logs showing query time vs total processing time
- **Error Handling**: Graceful fallback with detailed console logging for debugging

#### 3. Custom Instructions Integration (`custom-instructions.ts`)
- **YAML Formatting**: Uses `js-yaml` library for human-readable format (better than JSON for AI)
- **Data Sanitization**: `sanitizeForSerialization()` function handles BigInt, Date, and nested objects
- **Length Tracking**: Logs character counts for schema and final instructions (for token monitoring)
- **Enhanced Context**: Sample data embedded directly in AI system prompt as YAML
- **Fallback**: JSON format if YAML serialization fails

### ⚡ **Performance Characteristics**
- **Collection Time**: ~15-35ms per table (measured and logged)
- **Memory Usage**: Minimal (10 rows × number of columns per table)
- **Storage**: Temporary in `window.__enrichedTables` (not persisted to localStorage)
- **Sampling Method**: DuckDB's optimized reservoir sampling > 90% success rate
- **Fallback**: LIMIT 10 used when reservoir sampling unavailable (~10% of cases)

### 📊 **Data Format Example**
```yaml
- tableName: earthquakes
  isView: false
  columns:
    - name: id
      type: INTEGER
    - name: magnitude
      type: DOUBLE
    - name: location
      type: VARCHAR
    - name: timestamp
      type: TIMESTAMP
  rowCount: 1000
  inputFileName: "earthquakes.csv"
  sampleRows:
    - id: 1
      magnitude: 7.2
      location: "California"
      timestamp: "2023-01-15T10:30:00.000Z"
    - id: 2
      magnitude: 6.8
      location: "Japan"
      timestamp: "2023-02-22T14:45:00.000Z"
```

### 🔄 **Troubleshooting & Console Logs**

**Expected Success Logs:**
```
🔍 [SAMPLE ENHANCEMENT] Enhancing 2 tables with sample rows
✅ [SAMPLE ROWS] "memory"."main"."earthquakes": 8 rows via RESERVOIR_SAMPLE (query: 15.2ms, total: 18.7ms)
✅ [SAMPLE ROWS] "memory"."main"."odi_t20": 10 rows via LIMIT (query: 12.1ms, total: 14.3ms)
📊 [SAMPLE ROWS] Collected samples for 2/2 tables
📋 [CUSTOM INSTRUCTIONS] Sample rows available for: earthquakes(8), odi_t20(10)
📋 [CUSTOM INSTRUCTIONS] Schema YAML length: 3420
```

**Error Indicators:**
- `🔄 [SAMPLE ROWS] RESERVOIR_SAMPLE failed` - Normal, will fallback to LIMIT
- `⚠️ [SAMPLE ROWS] Could not collect sample rows` - Table access issue
- `❌ [SCHEMA YAML] Error formatting schema as YAML` - BigInt serialization issue (should be fixed)

## AI Schema Awareness System

**Location**: `src/components/DataSourcesPanel.tsx` + `sql-rooms-main-repo/packages/duckdb/src/DuckDbSlice.ts` + Sample Enhancement System

### 🔄 **How AI Agent Automatically Knows About New Tables**

#### 1. Schema Refresh Trigger
When you add a table (via file drop in DataSourcesPanel):
```typescript
// In src/components/DataSourcesPanel.tsx (line 153)
await connector.loadFile(file, tableName, loadOptions);
// ... file loading logic ...
await refreshTableSchemas(); // ← Triggers schema refresh
```

#### 2. Schema Refresh Process (Reference Only - in npm package)
The `refreshTableSchemas()` function queries DuckDB for all tables and views:
```typescript
// In sql-rooms-main-repo/packages/duckdb/src/DuckDbSlice.ts (REFERENCE ONLY)
async refreshTableSchemas(): Promise<DataTable[]> {
  // Query DuckDB for all tables and views with complete metadata
  const describeResults = await connector.query(`
    WITH tables_and_views AS (
      FROM duckdb_tables() SELECT database_name, schema_name, table_name, sql, comment, estimated_size, FALSE AS isView
      UNION
      FROM duckdb_views() SELECT database_name, schema_name, view_name, sql, comment, NULL estimated_size, TRUE AS isView
    )
    SELECT isView, database, schema, name, column_names, column_types, sql, comment, estimated_size
    FROM (DESCRIBE) LEFT OUTER JOIN tables_and_views USING (database, schema, name)
  `);

  // Update the store with new table schemas
  set((state) => produce(state, (draft) => {
    draft.db.tables = newTables; // ← Updates cached schemas
  }));
}
```

#### 3. Sample Rows Enhancement (Local Implementation)
**Location**: `src/hooks/useSampleRowsEnhancement.ts` + `src/utils/collectSampleRows.ts`

When schema refreshes, our local enhancement hook automatically collects sample rows:
```typescript
// In src/hooks/useSampleRowsEnhancement.ts (LOCAL IMPLEMENTATION)
useEffect(() => {
  const enhanceTables = async () => {
    if (tables && tables.length > 0) {
      const tablesNeedingSamples = tables.filter(table =>
        !table.sampleRows || table.sampleRows.length === 0
      );

      if (tablesNeedingSamples.length > 0) {
        const enrichedTables = await enrichTablesWithSampleRows(
          await db.getConnector(),
          tables
        );

        // Store enriched tables in window object for custom instructions
        (window as any).__enrichedTables = enrichedTables;
      }
    }
  };
  enhanceTables();
}, [tables, db]);
```

#### 4. Sample Collection Implementation
**Location**: `src/utils/collectSampleRows.ts` (LOCAL IMPLEMENTATION)

Uses DuckDB's reservoir sampling for representative data:
```typescript
// Primary method: Reservoir sampling (random 10 rows)
sampleQuery = `SELECT * FROM ${tableName} USING SAMPLE 10`;

// Fallback method: Simple LIMIT 10
sampleQuery = `SELECT * FROM ${tableName} LIMIT 10`;
```

#### Schema Passed to AI on Every Question
When you ask a question, the AI analysis starts with current schemas:
```typescript
// In sql-rooms-main-repo/packages/ai/src/AiSlice.ts (line 341)
await runAnalysis({
  tableSchemas: get().db.tables, // ← Current table schemas passed here
  // ... other parameters
});
```

#### Enhanced Schema Embedded in AI Instructions
**Location**: `src/config/custom-instructions.ts`

The schema gets formatted as YAML with sample rows included:
```typescript
// Custom instructions now use enriched tables with sample data
let enrichedTables = tablesSchema;
if ((window as any).__enrichedTables) {
  enrichedTables = (window as any).__enrichedTables;
}

// Format schema with sample data as YAML
const schemaYAML = formatSchemaAsYAML(enrichedTables);
console.log('📋 [CUSTOM INSTRUCTIONS] Schema YAML length:', schemaYAML.length);
console.log('📋 [CUSTOM INSTRUCTIONS] Final instructions length:', customInstructions.length);
```

**Length Measurements**: The logged lengths are **character counts** (not bytes/kb/mb):
- `Schema YAML length: 3078` = 3,078 characters
- `Final instructions length: 7129` = 7,129 characters

**Understanding the Lengths**:
- **Character Count**: Each character (letter, number, space, punctuation) counts as 1
- **Not Bytes**: UTF-8 characters can be 1-4 bytes, but we count characters
- **Not Kilobytes**: 1KB = 1,024 bytes, but we're counting characters
- **Not Megabytes**: 1MB = 1,048,576 bytes, but we're counting characters
- **Purpose**: Monitor instruction size for AI model token limits
- **Typical Ranges**: 
  - 1 table: ~3,000-4,000 characters
  - 2 tables: ~9,000-14,000 characters
  - More tables: Scales linearly with data complexity

### Schema Information Included

The enhanced `DataTable[]` schema sent to the AI contains:
```typescript
type DataTable = {
  table: QualifiedTableName;     // {database, schema, table}
  isView: boolean;               // Whether it's a view or table
  database?: string;             // Database name
  schema: string;                // Schema name  
  tableName: string;             // Table name
  columns: TableColumn[];        // Column definitions
  rowCount?: number;             // Number of rows
  inputFileName?: string;        // Original file name
  sql?: string;                  // CREATE statement
  comment?: string;              // Table comment
  sampleRows?: Array<Record<string, any>>; // Up to 10 sample rows (NEW)
};

type TableColumn = {
  name: string;                  // Column name
  type: string;                  // Column data type (VARCHAR, INTEGER, etc.)
};
```

**Sample Rows Enhancement**:
- **Collection Method**: DuckDB reservoir sampling (`USING SAMPLE 10`) with LIMIT fallback
- **Data Sanitization**: BigInt values converted to numbers for JSON serialization
- **Performance**: Each table sampled in ~15-35ms with detailed timing logs
- **Storage**: Enriched tables stored in `window.__enrichedTables` for custom instructions
- **Format**: Sample rows included in YAML schema format for better AI readability

### Schema Awareness Flow

1. **User drops file** → DataSourcesPanel.loadFile
2. **File loaded** → connector.loadFile creates table
3. **Schema refresh** → refreshTableSchemas() called
4. **DuckDB query** → Query all tables/views with metadata
5. **Store update** → Update store.db.tables cache
6. **Sample enhancement** → useSampleRowsEnhancement hook triggered
7. **Sample collection** → collectSampleRows() for each table (USING SAMPLE 10)
8. **Enrichment storage** → Enhanced tables stored in window.__enrichedTables
9. **User asks question** → startAnalysis called
10. **Schema retrieval** → get().db.tables passed to runAnalysis
11. **Custom instructions** → getCustomInstructions() uses enriched tables with samples
12. **YAML formatting** → Schema + samples formatted as YAML for AI
13. **AI awareness** → AI receives complete schema + sample data in system prompt

### Key Features

#### Automatic Schema Updates
- ✅ **Real-time**: Schema refreshes immediately after table addition
- ✅ **Complete**: Includes all tables, views, columns, and metadata
- ✅ **Persistent**: Schema cached in store until next refresh
- ✅ **Automatic**: No manual intervention needed

#### Schema Content
- ✅ **Table Structure**: Names, schemas, databases
- ✅ **Column Details**: Names and data types
- ✅ **Metadata**: Row counts, file names, comments
- ✅ **SQL Definitions**: CREATE statements for views
- ✅ **View Support**: Distinguishes between tables and views
- ✅ **Sample Data**: Up to 10 representative rows per table (NEW)

#### Sample Rows Enhancement
- ✅ **Automatic Collection**: Triggered when schema changes
- ✅ **Reservoir Sampling**: Random representative data via `USING SAMPLE 10`
- ✅ **Performance Optimized**: ~15-35ms per table with detailed timing
- ✅ **Fallback Support**: LIMIT 10 if reservoir sampling fails
- ✅ **Data Sanitization**: BigInt conversion for JSON compatibility
- ✅ **YAML Format**: Human-readable format for AI consumption

#### AI Integration
- ✅ **Every Question**: Schema + samples included in every AI analysis
- ✅ **Enhanced Instructions**: Custom instructions with enriched data
- ✅ **YAML Format**: Better readability than JSON for AI
- ✅ **Complete Context**: AI knows structure AND actual data patterns
- ✅ **Character Tracking**: Length monitoring for instruction size management

### Database Import System

**Location**: `src/utils/importDuckDB.ts` + `src/components/ImportDBModal.tsx` + `src/components/ImportDBButton.tsx` + `src/components/DataSourcesPanel.tsx`

### 🎯 **Overview**
Complete database import system that allows users to import entire DuckDB database files (.db, .duckdb) into the application as new schemas. This complements the file import system by enabling bulk table imports from existing database files.

### 🏗️ **Architecture Components**

#### 1. **Core Import Utility** (`src/utils/importDuckDB.ts`)
- **Purpose**: Schema-based import system that loads DuckDB files into new schemas
- **Strategy**: Creates separate schemas for each imported database (not ATTACH-based)
- **Process**: File upload → Schema creation → Table extraction → Data transfer → Cleanup
- **Browser Compatible**: Works within DuckDB-Wasm limitations without ATTACH dependencies

#### 2. **Import Button** (`src/components/ImportDBButton.tsx`)
- **Placement**: Below "Export Table" and "Download Database" buttons in DataSourcesPanel
- **File Filter**: Accepts only `.db` and `.duckdb` files
- **User Interaction**: Hidden file input triggered by button click
- **Icons**: Database icon + upload arrow for clear visual indication

#### 3. **Import Modal** (`src/components/ImportDBModal.tsx`)
- **Purpose**: Configuration interface for database import with schema naming and conflict resolution
- **Features**:
  - File information display (name, size)
  - Auto-generated schema names (editable)
  - Schema conflict detection with replace option
  - Real-time validation and loading states
- **UX**: Clean modal design with progress indicators and error handling

#### 4. **DataSourcesPanel Integration**
- **State Management**: `selectedImportFile` and `isImportModalOpen` state
- **Event Handlers**: `handleImportFileSelect`, `handleImportDatabase`, `handleImportModalClose`
- **Schema Refresh**: Automatic schema refresh after successful import
- **Toast Integration**: Success/error notifications via existing toast system

### ⚡ **Import Process Flow**

#### **Step-by-Step Import Process**
1. **File Selection** → User clicks "Import Database" button → File picker opens
2. **File Validation** → Check `.db`/`.duckdb` extensions → Open modal if valid
3. **Schema Configuration** → Auto-generate schema name → Check conflicts → User confirmation
4. **File Loading** → Load file into DuckDB-Wasm filesystem using `registerFileBuffer()`
5. **Database Attachment** → Attach uploaded file as temporary database (`ATTACH 'temp_file.db' AS temp_import`)
6. **Table Discovery** → Query `information_schema.tables` to find all tables in source database
7. **Schema Analysis** → For each table, extract column information and row counts
8. **Schema Creation** → `CREATE SCHEMA IF NOT EXISTS schema_name` in target database
9. **Table Recreation** → `CREATE TABLE schema.table AS SELECT * FROM temp_import.table` for each table
10. **Data Transfer** → All data copied via CREATE TABLE AS SELECT (single operation per table)
11. **Cleanup** → `DETACH temp_import` and `dropFile(tempFileName)` to clean temporary files
12. **Schema Refresh** → Refresh table schemas so AI and UI see imported tables

### 📋 **Technical Implementation Details**

#### **Schema Naming Strategy**
```typescript
export const generateSchemaName = (filename: string): string => {
  return filename
    .replace(/\.(db|duckdb)$/i, '') // Remove extension
    .replace(/[^a-zA-Z0-9_]/g, '_') // Replace invalid chars with underscore
    .toLowerCase()
    .substring(0, 30); // Limit length for readability
};
```

#### **File Upload Process**
```typescript
// Load file into DuckDB-Wasm filesystem
const arrayBuffer = await file.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);
const tempFileName = `temp_import_${Date.now()}.db`;

// Register file buffer in DuckDB-Wasm
const duckdbInstance = await db.getConnector().then((connector: any) => connector.getDb());
await duckdbInstance.registerFileBuffer(tempFileName, uint8Array);
```

#### **Table Extraction Query**
```sql
-- Get all tables from attached database
SELECT table_name
FROM information_schema.tables
WHERE table_catalog = 'temp_import'
AND table_schema = 'main'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Get column information for each table
SELECT column_name as name, data_type as type
FROM information_schema.columns
WHERE table_catalog = 'temp_import'
AND table_name = '${tableName}'
AND table_schema = 'main'
ORDER BY ordinal_position;

-- Get row count for each table
SELECT COUNT(*) as count FROM temp_import.${tableName};
```

#### **Data Transfer Method**
```sql
-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS ${schemaName};

-- Create table with data in single operation
CREATE TABLE ${schemaName}.${tableName} AS
SELECT * FROM temp_import.${tableName};
```

### 🎮 **User Interface Design**

#### **Button Layout in DataSourcesPanel**
```
┌── Export Controls ──────────┐
│ [📊 Export Table        ] │
│ [💾 Download Database   ] │
│ [📤 Import Database     ] │  ← NEW: Database import
└─────────────────────────────┘
```

#### **Import Modal Interface**
```
┌─ Import DuckDB Database ─────── ✕ ─┐
│ Import tables from a DuckDB file    │
│ into a new schema.                  │
│                                     │
│ File: [sample_data.db] (2.5 MB)     │
│                                     │
│ Schema Name: [sample_data        ]  │
│ ⚠️ Schema 'sample_data' already exists │
│ □ Replace existing schema           │
│                                     │
│              [Cancel] [Import]      │
└─────────────────────────────────────┘
```

### 🔧 **Error Handling & Validation**

#### **File Validation**
- **Extension Check**: Only accepts `.db` and `.duckdb` files
- **File Size**: No explicit limits, but large files may cause memory issues
- **Format Validation**: Attempts to attach file to validate it's a valid DuckDB database

#### **Schema Conflict Resolution**
- **Automatic Detection**: `checkSchemaExists()` queries `information_schema.schemata`
- **User Choice**: Modal shows warning with "Replace existing schema" checkbox
- **Safe Replacement**: `DROP SCHEMA IF EXISTS ${schemaName} CASCADE` before import if replacing

#### **Import Error Handling**
```typescript
// Error scenarios handled:
try {
  const result = await importDuckDBFile(db, file, schemaName, toast);
} catch (error) {
  // 1. File loading failures
  // 2. Database attachment failures
  // 3. Schema creation failures
  // 4. Table extraction failures
  // 5. Data transfer failures
  // Each with specific error messages and cleanup
}
```

### 📊 **Performance Characteristics**

#### **Import Performance**
- **File Loading**: ~100-500ms for typical database files (depends on file size)
- **Table Discovery**: ~50-200ms (scales with number of tables)
- **Data Transfer**: ~100ms-5s per table (depends on row count and complexity)
- **Total Time**: Typically 1-10 seconds for moderate databases (10-50 tables, <1GB)

#### **Memory Usage**
- **Temporary File**: Full database loaded into DuckDB-Wasm memory during import
- **Data Transfer**: CREATE TABLE AS SELECT is memory efficient (streaming)
- **Cleanup**: All temporary files and connections cleaned up automatically
- **Peak Usage**: ~2-3x file size during import process

### 🔍 **Console Logging Pattern**

```typescript
// File validation and loading
🔍 [DUCKDB IMPORT] Available db methods: [...]
📁 [DUCKDB IMPORT] Loading file 'sample.db' (2.50 MB) into DuckDB-Wasm...
✅ [DUCKDB IMPORT] File loaded as 'temp_import_1640995200000.db'

// Database analysis
🔗 [DUCKDB IMPORT] Attached database as 'temp_import'
📋 [DUCKDB IMPORT] Querying attached database for table list...
📊 [DUCKDB IMPORT] Found 5 tables: users, orders, products, reviews, categories

// Table processing
🔍 [DUCKDB IMPORT] Analyzing table 'users'...
📋 [DUCKDB IMPORT] Table 'users': 3 columns, 1000 rows (BigInt converted: false)

// Schema creation and import
🏗️ [DUCKDB IMPORT] Creating schema 'sample_db' and importing 5 tables...
✅ [DUCKDB IMPORT] Created schema 'sample_db'
📋 [DUCKDB IMPORT] Importing table 'users' (1000 rows)...
✅ [DUCKDB IMPORT] Imported 'users' in 245.7ms

// Completion
🎉 [DUCKDB IMPORT] Successfully imported 5 tables with 15420 total rows
🗑️ [DUCKDB IMPORT] Cleaning up temporary database...
✅ [DUCKDB IMPORT] Cleanup completed
```

### 🎯 **Key Benefits**

#### **Technical Benefits**
- **Schema-Based Architecture**: Single database with multiple schemas (cleaner than ATTACH)
- **Full Read-Write Access**: Imported tables have complete DDL/DML permissions
- **Browser Compatible**: Works within DuckDB-Wasm limitations without remote ATTACH
- **Atomic Operations**: CREATE TABLE AS SELECT ensures data consistency

#### **User Experience Benefits**
- **Single-Click Import**: Complete database import via simple button + modal
- **Intelligent Naming**: Auto-generated schema names with conflict detection
- **Progress Feedback**: Loading states, progress indicators, and completion notifications
- **Error Recovery**: Clear error messages with automatic cleanup on failure

#### **Integration Benefits**
- **Schema Awareness**: Imported tables automatically visible to AI and UI
- **Sample Enhancement**: Automatic sample row collection for imported tables
- **Export Compatibility**: Imported tables work with existing export systems
- **Query Support**: Cross-schema queries supported in custom query tool

### 🔗 **Integration Points**

#### **Schema Awareness System**
- **Automatic Refresh**: `refreshTableSchemas()` called after successful import
- **Sample Enhancement**: `useSampleRowsEnhancement` hook automatically processes imported tables
- **AI Context**: Enhanced schema with sample rows includes imported tables
- **Multi-Schema Support**: All systems handle schema.table naming convention

#### **Export Systems**
- **Database Export**: ZIP export includes tables from all schemas
- **Table Export**: Individual table export works with schema.table references
- **Query Results**: Cross-schema queries supported in AI and manual queries

### 📦 **File Structure**

```
src/
├── utils/
│   ├── exportDatabase.ts       # Existing - Full database export
│   ├── exportTable.ts          # Existing - Single table export
│   └── importDuckDB.ts         # NEW - Database import utilities
├── components/
│   ├── DataSourcesPanel.tsx    # Modified - Added import button and modal
│   ├── ImportDBButton.tsx      # NEW - Import button component
│   └── ImportDBModal.tsx       # NEW - Import configuration modal
```

### 🚨 **Critical Technical Notes**

#### **DuckDB-Wasm Specific Implementation**
- **File Registration**: Uses `registerFileBuffer()` not filesystem paths
- **Database Methods**: `getConnector().then(connector => connector.getDb())` for DuckDB instance
- **Cleanup Required**: Always call `dropFile()` to prevent memory leaks
- **BigInt Handling**: Row counts need conversion from BigInt to Number for JSON compatibility

#### **Schema vs ATTACH Approach**
- **Why Not ATTACH**: Browser limitations with local file ATTACH in DuckDB-Wasm
- **Schema Benefits**: Full read-write access, better integration, cleaner architecture
- **Trade-offs**: Data duplication vs. file references (acceptable for import use case)

#### **Error Recovery Strategy**
- **Atomic Schema Creation**: Either complete success or complete rollback
- **Cleanup Guaranteed**: Finally block ensures temporary files always removed
- **User Feedback**: All errors reported via toast with actionable messages

### 🎭 **Usage Workflow**
1. **Access**: Click "Import Database" button in Data Sources panel
2. **Select**: Choose `.db` or `.duckdb` file from file picker
3. **Configure**: Review/edit schema name, handle conflicts if needed
4. **Import**: Click Import to start the process (with progress indicator)
5. **Complete**: Tables appear in schema tree, AI automatically aware of new data
6. **Query**: Use imported tables in queries via `schema_name.table_name` syntax

## Default Dataset Version Control System

**Location**: `src/store.ts` (lines 81-88) + `src/room.tsx` (lines 13-47)

### 🎯 **Overview**
Simple version-based control for default datasets. When you change the default dataset, update the version number and old data automatically clears.

### 📋 **How It Works**

**Flow:**
1. **Version Field**: Each dataSource has a `datasetVersion` field
2. **Version Check**: On app load, compares current vs stored version (localStorage key: `default-dataset-version`)
3. **Auto-Clear**: If changed → drops old table, new downloads automatically
4. **Safety**: Only affects first dataSource (default dataset), never user-imported tables

**Implementation:**
- `src/store.ts:86` - Version definition in dataSources config
- `src/room.tsx:13-47` - Version check logic in useEffect hook

### 🚀 **How to Change Default Dataset**

**File**: `src/store.ts` (Lines 81-88)

```typescript
dataSources: [
  {
    tableName: 'your_new_table',              // 1. Change table name
    type: 'url',
    url: 'https://your-url.com/data.csv',     // 2. Change URL
    datasetVersion: 'v2-yourdata-2025',       // 3. MUST change version!
  },
],
```

**Version naming**: `v{number}-{description}-{year}` (e.g., `v1-cycling-2025`, `v2-sales-2025`)

### 📊 **Console Logs**

```
📌 [DATASET VERSION] Current version: v1-cycling-2025
🔄 [DATASET VERSION] Version changed from v1-cycling-2025 to v2-sales-2025
🗑️ [DATASET VERSION] Clearing old default dataset...
✅ [DATASET VERSION] Old dataset cleared, new one will download automatically
```

### ⚙️ **Technical Details**

- **Storage**: Version stored in `localStorage.getItem('default-dataset-version')`
- **Trigger**: useEffect runs once on Room component mount
- **Drop Logic**: `DROP TABLE IF EXISTS ${tableName}` via DuckDB connector
- **Safety**: Try-catch prevents crashes, only drops first dataSource table
- **User Tables**: Completely unaffected by version changes

---

## Database Persistence System

**Location**: DuckDB initialization in `@sqlrooms/duckdb` package

### 🔍 **Current Behavior: NO PERSISTENCE** ❌

**DuckDB Mode**: In-memory (`:memory:`) - All tables lost on page refresh

**Evidence:**
- `sql-rooms-main-repo/packages/duckdb/src/connectors/WasmDuckDbConnector.ts:43`
  ```typescript
  dbPath = ':memory:',  // Default: In-memory database
  ```
- User-imported tables: ❌ Not persisted
- Default dataset: ❌ Re-downloads on each session
- AI chat sessions: ✅ Persisted (in localStorage, not DuckDB)

### 📦 **What Gets Persisted Currently**

**localStorage** (`ai-example-app-state-storage`):
- ✅ AI chat sessions (last 10 + example sessions)
- ✅ API keys
- ❌ Database tables (NOT persisted)
- ❌ dataSources config (excluded by partialize)

**IndexedDB**:
- ❌ Not used (DuckDB in `:memory:` mode)

### 🔧 **How to Enable Persistence** (If Needed Later)

**Option 1: Enable DuckDB IndexedDB Persistence (Simplest)**

Change DuckDB path from `:memory:` to a real database name:

```typescript
// In DuckDB initialization (requires package config or override)
dbPath = 'sqlrooms.db'  // ← Auto-persists to IndexedDB
```

**Impact:**
- ✅ All tables persist (user + default)
- ✅ Survives page refresh
- ⚠️ Default dataset won't auto-update (version control still needed)

**Where to change:**
- Check if `createRoomShellSlice` accepts `duckdb: { dbPath: 'sqlrooms.db' }` config
- OR override at Room initialization point
- Last resort: Modify `@sqlrooms/duckdb` package source

---

**Option 2: Hybrid - Persist User Tables, Refresh Default**

```typescript
// Enable persistence
dbPath = 'sqlrooms.db'

// Version control handles default dataset updates
// User tables persist automatically
```

**Best of both worlds:**
- ✅ User imports persist
- ✅ Default dataset updates on version change
- ✅ ~20-30 lines of code

---

**Option 3: No Persistence (Current)**

```typescript
dbPath = ':memory:'  // Current setup
```

**Benefits:**
- ✅ Always fresh data
- ✅ No stale data issues
- ❌ User must re-import tables every session
- ❌ Slower startup (re-download default dataset)

### 🎯 **Decision Framework**

| Requirement | Recommended Approach |
|------------|---------------------|
| Users don't import data | Keep `:memory:` (current) |
| Users import data frequently | Enable persistence (Option 1) |
| Control default + persist user | Hybrid (Option 2) |

### 📋 **Implementation Complexity**

- **Enable persistence**: 1-5 lines (if config option exists)
- **Hybrid approach**: 20-30 lines
- **Package modification**: 50+ lines (if no config option)

---

## Default Dataset Download Flow

**Location**: `@sqlrooms/room-shell` package (RoomShellStore.ts) + localStorage caching

### 🔄 **Why Default Dataset Persists in Browser**

**Root Cause**: DuckDB tables persist in IndexedDB OR localStorage caches download state

**Flow Analysis:**

```
Day 1 (Fresh Browser):
1. App loads → store.ts defines dataSources with URL
2. Room.initialize() → db.initialize() → maybeDownloadDataSources()
3. Checks: dataSourceStates[tableName].status === PENDING?
4. YES → Downloads CSV from URL → Loads into DuckDB
5. DuckDB (if not :memory:) saves to IndexedDB
6. localStorage stores download completion state

Day 2 (Returning User):
1. App loads → Checks dataSourceStates or DuckDB for existing table
2. Finds: Table already exists OR download marked complete
3. SKIPS download → Uses cached data ❌
4. Version control fix: Detects version change → Drops table → Re-downloads ✅
```

**Key Learning**: Even with `:memory:`, download state might cache in localStorage `roomFilesProgress`

### 📍 **Download Logic Location**

**Reference Only** (in NPM package `@sqlrooms/room-shell`):

```typescript
// sql-rooms-main-repo/packages/room-shell/src/RoomShellStore.ts:489-628

async function maybeDownloadDataSources() {
  const pendingDataSources = dataSources.filter(
    (ds) => dataSourceStates[ds.tableName]?.status === DataSourceStatus.PENDING
  );

  const filesToDownload = pendingDataSources.filter((ds) => {
    switch (ds.type) {
      case 'url': return !roomFilesProgress[ds.url];  // ← Check if already downloaded
      // ...
    }
  });

  if (filesToDownload.length > 0) {
    await downloadRoomFiles(filesToDownload);
  }
}
```

**Storage Check**: `roomFilesProgress[url]` determines if download needed

### 🛡️ **Version Control Solution**

**Our Fix** (`src/room.tsx:13-47`):
- Bypasses download cache by dropping table directly
- Forces PENDING state for that dataSource
- Download logic sees missing table → Re-downloads

**Why it works**:
- `DROP TABLE` removes from DuckDB
- Download logic checks table existence
- Missing table → Status becomes PENDING
- PENDING → Triggers download

---

## Current Status: ✅ All Systems Operational

**Core Functionality:**
- **DDL Operations**: CREATE/DROP/ALTER tables working
- **Chart System**: ✅ Vega Lite visualizations (browser-side rendering) - Python charts disabled pending security
- **File Import**: Smart delimiter detection for all formats
- **Database Export**: Parquet-based ZIP with 85-90% compression
- **Table Export**: ✅ Individual table export with CSV/Pipe/Parquet formats
- **Database Import**: ✅ Complete DuckDB file import into separate schemas
- **API Key Management**: Provider-specific storage with automatic model switching
- **Tool Selection**: AI intelligently chooses tools based on descriptions + instructions
- **Dataset Version Control**: ✅ Automatic default dataset updates via version field

**Enhanced AI Context:**
- **Schema Awareness**: AI automatically knows about all tables and their structure (including imported schemas)
- **Sample Rows Enhancement**: ✅ Automatic collection of up to 10 random sample rows per table
- **YAML Schema Format**: ✅ Enhanced readability with sample data in YAML format
- **Performance Monitoring**: ✅ Detailed timing logs (~15-35ms per table)
- **Smart Sampling**: ✅ DuckDB reservoir sampling with LIMIT fallback
- **Data Sanitization**: ✅ BigInt/Date conversion for JSON/YAML compatibility
- **Real-time Enhancement**: ✅ Automatic sample collection when schema changes
- **Multi-Schema Support**: ✅ Schema awareness includes all schemas (main + imported)

**Enhanced Error Recovery & Query Safety (Nov 2025):**
- **Error Recovery**: ✅ Uses all 15 tool execution steps instead of giving up after 2-3 attempts
- **Same Error Strategy**: ✅ Switches to completely different approach after 2x same error (not minor tweaks)
- **SELECT Query Safety**: ✅ Forces LIMIT on 1000+ row tables to prevent memory crashes
- **Data Mart Intelligence**: ✅ Uses CREATE TABLE (persistent) instead of SELECT (temporary) for summaries
- **Memory Protection**: ✅ Checks row counts before querying, prevents 300K+ row loads
- **Diagnostic Consistency**: ✅ All diagnostic queries use LIMIT 5 (safe, fast, consistent)

**Data Persistence:**
- **DuckDB Tables**: ❌ NOT persisted (`:memory:` mode - lost on refresh)
- **AI Sessions**: ✅ Persisted to localStorage (last 10 + examples)
- **API Keys**: ✅ Persisted to localStorage
- **Default Dataset**: ✅ Version-controlled auto-refresh
- **User Tables**: ❌ Must re-import on each session (can enable persistence if needed)

**UI/UX:**
- **Layout Issues**: Text wrapping and table overflow fixed
- **Theme**: Light theme as default
- **Tool Integration**: Custom tools properly override defaults
- **Import Interface**: ✅ Professional modal-based database import
- **Console Performance**: ✅ API modal spam bug fixed (was causing 100s of logs per keystroke)

**Console Monitoring:**
- `📌 [DATASET VERSION]` - Version check and updates
- `✅ [SAMPLE ROWS]` - Successful sample collection with timing
- `📊 [SAMPLE ROWS]` - Collection summary statistics
- `📋 [CUSTOM INSTRUCTIONS]` - Sample availability and schema size tracking
- `🚀 [DUCKDB IMPORT]` - Database import process monitoring
- `✅ [DUCKDB IMPORT]` - Import completion and statistics
- `🔍 [DDL QUERY TOOL]` - Query execution attempts and diagnostic steps
- `❌ [DDL QUERY TOOL]` - Query failures with error details (triggers retry strategy)

---

## NPM Package Patching & UI Debugging System

**Context**: SQLRooms uses compiled NPM packages (`@sqlrooms/*`) that sometimes need modification for bug fixes or customization.

### 🔧 Patch-Package Setup

**Tool**: `patch-package` - Industry standard for patching node_modules (6.5M downloads/week)

**Configuration** (`package.json:12`):
```json
"postinstall": "patch-package"
```

**How It Works**:
1. Modify files in `node_modules/@sqlrooms/` directly
2. Run `npx patch-package @sqlrooms/package-name` to create patch
3. Patch file saved in `patches/@sqlrooms+package-name+version.patch`
4. Patch auto-applies on `npm install` via postinstall script
5. Works on Vercel deployments (postinstall runs there too)

### 📦 Active Patches

#### 1. @sqlrooms/vega (BigInt Fix)
**File**: `patches/@sqlrooms+vega+0.24.20.patch`
**Problem**: DuckDB returns BigInt values, Vega Lite expects Numbers
**Solution**: Use `arrowTableToJson()` instead of `.toArray()`
**Status**: ✅ Working

**Changes**:
```diff
-import { useSql } from '@sqlrooms/duckdb';
+import { useSql, arrowTableToJson } from '@sqlrooms/duckdb';

-return { [DATA_NAME]: result.data.toArray() };
+return { [DATA_NAME]: arrowTableToJson(result.data.arrowTable) };
```

#### 2. @sqlrooms/schema-tree (UI Display Fix)
**File**: `patches/@sqlrooms+schema-tree+0.24.20.patch`
**Problems**:
- Absolute positioning breaking flex layout
- Colored badges with opacity hiding text
- Font sizes inconsistent
- Table names wrapping instead of truncating

**Changes**:
- **BaseTreeNode.js**: Removed `relative` + `absolute` positioning, simplified to single flex container
- **ColumnTreeNode.js**: Replaced `ColumnTypeBadge` with plain text `<span>`, font `text-[11px]`, removed `h-[18px]` height restriction
- **TableTreeNode.js**: Added `truncate` class to table names, `overflow-hidden` to parent container, `flex-shrink-0` to row count

**Status**: ✅ Working

### ⚠️ Critical Vite Bundling Gotcha

**Problem**: Patches to `node_modules/@sqlrooms/*` files don't take effect even after:
- Server restart
- Hard browser refresh
- Cache clearing (`localStorage.clear()`, incognito mode)
- Deleting `node_modules/.vite` cache

**Root Cause**: Vite pre-bundles all `@sqlrooms/*` packages into optimized files:
- `node_modules/.vite/deps/@sqlrooms_sql-editor.js`
- `node_modules/.vite/deps/@sqlrooms_room-shell.js`

These bundled files are served instead of original patched files.

**Diagnosis**:
```bash
# Verify if patch is in bundled file
grep "text-\[11px\]" node_modules/.vite/deps/@sqlrooms_sql-editor.js
```

**Solutions Attempted**:
- ❌ `optimizeDeps: { exclude: ['@sqlrooms/schema-tree'] }` → Import errors
- ❌ Exclude all @sqlrooms packages → Dependency errors (lodash.debounce)
- ❌ Custom Vite plugin to patch bundles → Timing issues
- ✅ **Delete `.vite` cache** → Works but only until next rebuild

**Best Practice**: Always delete `node_modules/.vite` after creating patches:
```bash
npx patch-package @sqlrooms/package-name
rm -rf node_modules/.vite
# Restart dev server
```

### 🎨 Global CSS Override Issues

**Problem**: Tailwind utility classes not working (e.g., `.truncate` not truncating text)

**Root Cause**: Global CSS with `!important` can override utility classes

**Example** (`src/index.css:22-26`):
```css
/* This breaks .truncate */
p, li, div, span, h1, h2, h3, h4, h5, h6 {
  white-space: normal !important;  /* ← Overrides truncate's nowrap */
}
```

**Diagnostic Technique**:
```javascript
// Browser console
const el = document.querySelector('.truncate');
console.log('white-space:', window.getComputedStyle(el).whiteSpace);
// If "normal" instead of "nowrap", global CSS is overriding
```

**Solution** (`src/index.css:28-47`):
```css
/* Exclude .truncate from global span rules */
p, li, div, span:not(.truncate), h1, h2, h3, h4, h5, h6 {
  white-space: normal !important;
}

/* Add higher specificity for .truncate */
span.truncate,
.truncate {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* For flex items that need to shrink */
span.text-sm.truncate {
  flex: 1 1 0 !important;
  min-width: 0 !important;  /* Critical for flex shrinking */
}
```

### 🔍 Debugging Methodology for Future Issues

**When patches don't seem to work**:

1. **Verify patch is applied**:
   ```bash
   cat node_modules/@sqlrooms/package/dist/file.js | grep "your-change"
   ```

2. **Check Vite bundling**:
   ```bash
   dir node_modules\.vite\deps\ | findstr sqlrooms
   findstr "your-change" node_modules\.vite\deps\@sqlrooms_*.js
   ```

3. **Add console.log to patch**:
   ```javascript
   console.log("🔍 PATCH LOADED - Component Name");
   ```
   If log appears, patch is loading. If not, check Vite bundling.

4. **Check CSS overrides**:
   ```javascript
   // Browser DevTools console
   const el = document.querySelector('.your-element');
   console.log(window.getComputedStyle(el));
   ```

5. **Nuclear option - Clear everything**:
   ```bash
   # Delete Vite cache
   del /s /q node_modules\.vite
   # Restart dev server
   # Hard refresh browser (Ctrl+Shift+R)
   # Try incognito window
   ```

**User Preferences for Debugging**:
- "don't over engineer" - keep solutions simple
- "one iteration at a time" - methodical approach
- "think harder for this issue" - thorough analysis before changes
- Use console commands for diagnostics when stuck

### 📋 Patch Creation Workflow

1. **Edit the file** in `node_modules/@sqlrooms/package/dist/`
2. **Test the change** (may need to delete `.vite` cache)
3. **Create patch**: `npx patch-package @sqlrooms/package-name`
4. **Verify patch file** created in `patches/` directory
5. **Delete Vite cache**: `del /s /q node_modules\.vite`
6. **Restart dev server**
7. **Test in clean browser** (incognito recommended)
8. **Commit patch file** to git

### 🚨 Common Pitfalls

1. **Forgetting to delete `.vite` cache** → Changes don't appear
2. **Global CSS overrides** → Utility classes don't work
3. **Browser module caching** → Need hard refresh + incognito
4. **Source map errors** → Remove `//# sourceMappingURL=` comments from patches
5. **Assuming monorepo files are used** → Only NPM packages in `node_modules` are used

### 🎯 Dual-Axis Chart Instructions

**Location**: `src/config/custom-instructions.ts:172-183`

**Problem**: AI was generating incorrect Vega Lite specs for dual-axis charts (using stacking instead of layering)

**Solution**: Added compact instructions to guide AI:
```typescript
DUAL-AXIS CHARTS:
- When comparing metrics with different scales (e.g., revenue vs count, distance vs speed):
  * Use layered charts with 'resolve: {scale: {y: "independent"}}' at root level
  * Assign different colors to each layer for clarity
  * Use time/category field for x-axis (not entity names if data has multiple time periods)
- Example structure: {layer: [{mark: "bar", encoding: {...}}, {mark: "line", encoding: {...}}], resolve: {scale: {y: "independent"}}}
```

**Status**: ✅ Working - AI now generates correct dual-axis charts

---

## Session Management & Chat Stuck Bug Fix

**Context**: After users create many AI sessions, the chat input would get stuck - send button grayed out, unable to send messages. Clearing localStorage would fix it temporarily.

### 🐛 The Bug

**Symptoms**:
- Chat input field works (can type)
- Send button is grayed out (disabled)
- Console shows: `Current session found: false`
- Happens after creating 10+ sessions

**Root Cause**:
1. App limits sessions to last 10 + 3 example sessions (to prevent localStorage bloat)
2. When limiting, older sessions are removed from the array
3. **BUG**: `currentSessionId` still pointed to a deleted session
4. AI chat component checks `sessions.find(s => s.id === currentSessionId)` → returns `undefined`
5. Component disables send button when current session doesn't exist

**Location**: `src/store.ts:272-338` (partialize) and `src/store.ts:354-392` (migrate)

### ✅ The Fix

**Solution**: When limiting sessions, validate and update `currentSessionId`

**Code** (`src/store.ts:307-318`):
```typescript
// Check if current session still exists after limiting
const currentSessionId = state.config.ai.currentSessionId;
const currentSessionExists = limitedSessions.some(s => s.id === currentSessionId);

// If current session was removed, set to most recent session or null
const validCurrentSessionId = currentSessionExists
  ? currentSessionId
  : (limitedSessions[0]?.id || null);

if (!currentSessionExists && currentSessionId) {
  console.warn(`⚠️ [STORE] Current session '${currentSessionId}' was removed during limiting. Setting to: ${validCurrentSessionId || 'none'}`);
}
```

**Applied to**:
1. ✅ `partialize()` - Runs on every state save
2. ✅ `migrate()` - Runs when loading persisted state on app startup

### 📊 Session Limiting Logic

**Current Settings** (`src/store.ts:287`):
- Keep last **10 sessions** with content (non-empty)
- Always preserve **3 example sessions** (hardcoded IDs)
- Filter out empty sessions (no analysis results)
- Sort by `createdAt` date (newest first)

**Storage Monitoring** (`src/store.ts:320-335`):
```typescript
// Monitor localStorage size and warn if approaching quota
const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
console.log(`💾 [STORE] Persisting state: ${sizeInMB} MB (${limitedSessions.length} sessions)`);

// Warn if approaching 5MB limit (typical localStorage quota is 5-10MB)
if (sizeInBytes > 4 * 1024 * 1024) {
  console.warn('⚠️ [STORE] localStorage approaching quota limit! Size:', sizeInMB, 'MB');
}
```

**Console Logs**:
- `💾 [STORE] Persisting state: 0.05 MB (10 sessions)` - Normal save
- `⚠️ [STORE] Current session 'xxx' was removed during limiting` - Session ID updated
- `⚠️ [STORE] localStorage approaching quota limit!` - Storage near 4MB

### 🔍 Diagnostic Commands

**Check if chat is stuck due to invalid session**:
```javascript
const stored = JSON.parse(localStorage.getItem('ai-example-app-state-storage'));
const currentId = stored?.state?.config?.ai?.currentSessionId;
const sessionExists = stored?.state?.config?.ai?.sessions?.some(s => s.id === currentId);
console.log('Current session:', currentId);
console.log('Session exists:', sessionExists); // Should be true, if false = bug
```

**Check localStorage size**:
```javascript
console.log('=== STORAGE DIAGNOSTICS ===');
Object.keys(localStorage).forEach(key => {
  const size = localStorage[key].length;
  console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
});
```

**Fix stuck chat** (emergency workaround):
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 🚨 Common Pitfalls

1. **Modifying session array without updating currentSessionId** - Always validate after filtering/limiting
2. **Assuming currentSessionId is valid** - Always check existence before using
3. **Not handling migration** - Fix must be in both `partialize` and `migrate`
4. **Silent failures** - Added error logging via `onRehydrateStorage`

### 📝 Related Code

**Files Modified**:
- `src/store.ts` - Session limiting with currentSessionId validation
- Added storage size monitoring
- Added rehydration error handling

**Status**: ✅ Fixed - Chat will never get stuck due to invalid session ID

---

## Starter Prompts System

**Location**: `src/config/quickPrompts.ts` + `src/components/CustomQueryControls.tsx`

### 🎯 **Overview**
User-friendly starter prompts system that helps users discover common analysis patterns with one click. Features display text vs. actual prompts sent to AI, responsive mobile/desktop layouts, and centralized configuration.

### 🏗️ **Architecture Components**

#### 1. **Configuration File** (`src/config/quickPrompts.ts`)
- **Purpose**: Centralized management of all starter prompts
- **Structure**: Array of QuickPrompt objects with id, displayText, description, actualPrompt
- **Easy Management**: Simple to add/edit/remove prompts without touching UI code
- **Hot Reloading**: Changes reflect immediately in development

#### 2. **CustomQueryControls Integration**
- **Location**: `src/components/CustomQueryControls.tsx`
- **UI Placement**: Prompt buttons appear above the query input area
- **Responsive Design**: Different layouts for mobile vs desktop
- **State Management**: Uses React useState for mobile expand/collapse

### 📱 **Responsive Design**

#### Mobile Layout (≤768px)
- **Display**: Shows first prompt + "More..." button
- **Expanded**: All prompts visible with "Less..." button to collapse
- **Auto-Collapse**: Prompts automatically collapse after selection
- **CSS Classes**: `md:hidden` hides on desktop

#### Desktop Layout (>768px)
- **Display**: All prompts visible in a row
- **Wrapping**: Flex-wrap allows multiple rows if needed
- **CSS Classes**: `hidden md:flex` hides on mobile

### 🎮 **User Experience Flow**

1. **User sees starter prompts** → Buttons displayed above input
2. **Clicks a prompt** → displayText shown on button
3. **Prompt sent to AI** → actualPrompt (detailed version) sent to LLM
4. **Analysis runs** → AI processes the detailed prompt
5. **Mobile auto-collapse** → Prompts collapse on mobile after selection

### 💻 **Implementation Details**

#### QuickPrompt Interface
```typescript
export interface QuickPrompt {
  id: string;           // Unique identifier (no spaces, use underscores)
  displayText: string;  // Short text shown on button (2-6 words)
  description: string;  // Tooltip description for hover
  actualPrompt: string; // Detailed prompt sent to AI agent
}
```

#### Current Prompts (`src/config/quickPrompts.ts`)
```typescript
export const quickPrompts: QuickPrompt[] = [
  {
    id: "analyze_cycling_data",
    displayText: "Analyze Cycling Data",
    description: "Show top-ranked Tour de France riders from 2015-2025",
    actualPrompt: `For Tour De France data - Show the Rank 1 riders from 2015 to 2025, with their total distance (km), total time, and average speed (km/h) and the team. Table in Markdown text format.`
  },
  {
    id: "chart_top_winners",
    displayText: "Chart Top Winners",
    description: "Visualize riders with 3+ wins across Tour de France history",
    actualPrompt: `From the cycling Tour de France data, create a chart of riders who have won 3 or more times across history, showing how many wins each has.`
  }
];
```

#### Handler Logic (`CustomQueryControls.tsx:78-105`)
```typescript
const handleQuickPrompt = useCallback((promptId: string) => {
  if (isRunningAnalysis) return;

  // Find the prompt by ID
  const selectedPrompt = quickPrompts.find(prompt => prompt.id === promptId);
  if (!selectedPrompt) {
    console.error('Prompt not found:', promptId);
    return;
  }

  console.log(`📋 [QUICK PROMPT] Selected: "${selectedPrompt.displayText}"`);

  // Auto-collapse prompts on mobile after clicking
  if (typeof window !== 'undefined' && window.innerWidth <= 768 && showMorePrompts) {
    setShowMorePrompts(false);
  }

  // Set the prompt and trigger analysis
  setAnalysisPrompt(selectedPrompt.actualPrompt);

  // Small delay to ensure state is updated before running
  setTimeout(() => {
    if (model) {
      runAnalysis();
      onRun?.();
    }
  }, 50);
}, [isRunningAnalysis, showMorePrompts, model, setAnalysisPrompt, runAnalysis, onRun]);
```

### 📋 **Adding New Prompts**

**Steps**:
1. Open `src/config/quickPrompts.ts`
2. Add new object to the `quickPrompts` array
3. Provide unique `id` (no spaces, use underscores)
4. Set short `displayText` for button (2-6 words)
5. Write helpful `description` for tooltip
6. Create detailed `actualPrompt` for AI
7. Save file - changes appear immediately

**Example**:
```typescript
{
  id: "data_summary",
  displayText: "Data Summary",
  description: "Get a quick overview of the dataset statistics",
  actualPrompt: `Provide a comprehensive summary of the cycling_tour_de_france dataset including:
1. Total number of records
2. Date range covered
3. Number of unique riders
4. Number of unique teams
5. Key statistics (min/max/avg for distance, speed, time)
Present in a clear, structured format.`
}
```

### 🎨 **Styling**

**Button Styling**:
- Variant: `outline` - Clean, non-intrusive appearance
- Size: `sm` - Compact to fit multiple prompts
- Class: `text-xs rounded-full` - Small text, rounded pill shape
- Hover: Default outline hover effects
- Disabled: Grayed out when analysis is running

**Layout Styling**:
- Desktop: `hidden md:flex gap-2 flex-wrap` - Horizontal row with wrapping
- Mobile: `flex gap-2 flex-wrap` with conditional rendering
- Container: `gap-2` spacing between buttons
- Padding: `px-2` horizontal padding for container

### 🔍 **Console Logging**

```typescript
// When prompt is selected
📋 [QUICK PROMPT] Selected: "Analyze Cycling Data"
📋 [QUICK PROMPT] Selected: "Chart Top Winners"
```

### 🎯 **Key Benefits**

#### User Experience
- **Discoverability**: Users see example analyses immediately
- **One-Click**: Start complex analysis with single click
- **Learning**: Users learn what questions to ask by example
- **Mobile-Friendly**: Clean UX on small screens with expand/collapse

#### Developer Experience
- **Centralized Config**: All prompts in one file
- **Easy Maintenance**: Add/edit/remove without touching UI code
- **Type Safety**: TypeScript interfaces prevent errors
- **Hot Reload**: Changes appear immediately in dev mode

#### Technical Benefits
- **Responsive**: CSS-first approach, no JavaScript flash
- **Performance**: Lightweight, no external dependencies
- **Flexible**: Easy to extend with categories, icons, etc.
- **Clean Code**: Separation of config and UI logic

### 📦 **File Structure**

```
src/
├── config/
│   └── quickPrompts.ts        # Centralized prompt configuration
├── components/
│   └── CustomQueryControls.tsx # UI integration with responsive design
```

### 🚀 **Future Enhancement Ideas**

1. **Prompt Categories**: Group prompts by type (analysis, charts, summaries)
2. **Dynamic Loading**: Load prompts from API/database
3. **User Custom Prompts**: Allow users to save their own prompts
4. **Prompt History**: Track most used prompts
5. **Search/Filter**: Search through available prompts
6. **Icons**: Add icons to prompts for visual categorization

### 🔧 **Technical Considerations**

- **State Timing**: 50ms delay ensures state update before runAnalysis()
- **Mobile Detection**: Uses `window.innerWidth` for reliable detection
- **Disabled State**: Prompts disabled during analysis to prevent duplicates
- **Tooltip Support**: `title` attribute provides hover descriptions
- **Accessibility**: Semantic button elements with proper ARIA support

**Status**: ✅ Implemented - Two starter prompts for cycling data analysis

---

## Global Out of Memory Error Handler System

**Location**: `src/utils/globalErrorHandler.ts` + `src/components/OutOfMemoryModal.tsx` + `src/components/GlobalErrorProvider.tsx` + `src/main.tsx` + `src/room.tsx` + all DuckDB operation files

### 🎯 **Overview**
Production-grade error handling system that catches Out of Memory errors from DuckDB operations and shows user-friendly modals. Uses both browser-level event listeners AND explicit error checking in DuckDB operations for comprehensive coverage.

### 🏗️ **Architecture Components**

#### 1. **Global Error Handler** (`src/utils/globalErrorHandler.ts`)
- **Purpose**: Core error detection and handling logic
- **Detection Patterns**:
  - `out of memory` (case insensitive)
  - `failed to allocate`
  - `allocation failure`
  - `3.1 gib/3.1 gib used`
  - `memory limit exceeded`
  - `unused blocks cannot be evicted`
- **Browser Listeners**: `unhandledrejection` (async errors) + `error` (sync errors)
- **Console Interception**: Overrides `console.error` to catch handled errors (removed by Terser in production with `drop_console: true`)
- **Export**: `handleOutOfMemoryError(error)` function for explicit error checking

#### 2. **Error Modal** (`src/components/OutOfMemoryModal.tsx`)
- **Purpose**: User-friendly error display with actionable guidance
- **Features**:
  - Clear explanation of what happened
  - Immediate solutions (reduce file size, simplify queries)
  - Custom deployment option info (memory limit configuration)
- **Styling**: Red alert theme with icons and structured layout
- **Integration**: Receives error via `GlobalErrorProvider` context

#### 3. **Global Error Provider** (`src/components/GlobalErrorProvider.tsx`)
- **Purpose**: React context provider for error state management
- **Critical Fix**: Uses `useMemo` instead of `useEffect` for handler registration
- **Why**: Terser's `drop_console: true` was removing `useEffect` with console.log
- **Implementation**:
  ```typescript
  React.useMemo(() => {
    setGlobalErrorHandler((error: OutOfMemoryError) => {
      handlerRef.current(error);
    });
  }, []); // No console.log, Terser can't remove this
  ```
- **State Management**: `currentError` state + `showOutOfMemoryError` callback via ref

#### 4. **Initialization** (`src/main.tsx`)
- **Setup**: `initializeGlobalErrorHandler()` called before React renders
- **Browser Listeners**: Registered for unhandled errors
- **Console Interception**: Attempted (will be removed by Terser in production, but that's OK)

#### 5. **Provider Wrapper** (`src/room.tsx`)
- **Integration**: `<GlobalErrorProvider>` wraps entire app
- **Modal Rendering**: OutOfMemoryModal rendered at app root level

### ⚡ **Error Detection Flow**

#### **Path 1: Browser Event Listeners** (Unhandled errors)
```
Unhandled error thrown
  ↓
window.addEventListener('error' or 'unhandledrejection')
  ↓
handleOutOfMemoryError(error)
  ↓
Checks error message against patterns
  ↓
If OOM: globalErrorHandler(oomError) → Modal shows ✅
```

#### **Path 2: Explicit Error Checking** (DuckDB operations)
```
DuckDB operation (import/export/query)
  ↓
try-catch block catches error
  ↓
handleOutOfMemoryError(error) called explicitly
  ↓
Checks error message against patterns
  ↓
If OOM: globalErrorHandler(oomError) → Modal shows ✅
  ↓
Error re-thrown for normal error handling (toast/alert)
  ↓
Both modal AND toast/alert shown (user sees both, which is fine)
```

**Note**: DuckDB worker thread errors require explicit checking because they run in separate JavaScript context

### 🔧 **Technical Implementation**

#### **Handler Registration (Terser-Proof)**
```typescript
// GlobalErrorProvider.tsx - NO console.log in critical path
const handlerRef = React.useRef(showOutOfMemoryError);
handlerRef.current = showOutOfMemoryError;

React.useMemo(() => {
  setGlobalErrorHandler((error: OutOfMemoryError) => {
    handlerRef.current(error);
  });
  // NO console.log here - prevents Terser removal
}, []);
```

**Why This Works**:
- `useMemo` with empty deps runs once during render (not after like useEffect)
- No `console.log` means Terser's `drop_console: true` can't optimize this away
- Real side effect (calling `setGlobalErrorHandler`) prevents tree-shaking

#### **Explicit Error Checking Pattern**
```typescript
// exportTable.ts, importDuckDB.ts, exportDatabase.ts, DataSourcesPanel.tsx
try {
  await duckdbOperation();
} catch (error) {
  console.error('Operation failed:', error);

  // Always check for OOM (will show modal if it is)
  handleOutOfMemoryError(error);

  // Always show toast/alert (modal + toast is fine - simple approach)
  toast({ variant: 'destructive', title: 'Failed', description: error.message });
}
```

**Why This Works**:
- Modal shows for OOM errors ✅
- Toast/alert shows for ALL errors (including OOM) ✅
- No complex conditional logic ✅
- No "success when failed" bugs ✅

### 📊 **Coverage Scope**

#### **Files with Explicit Error Checking**
- ✅ `src/utils/exportTable.ts:133-139` - Table export operations
- ✅ `src/utils/exportDatabase.ts:195-201` - Database export operations
- ✅ `src/utils/importDuckDB.ts:292-308` - Database import operations
- ✅ `src/components/DataSourcesPanel.tsx:261-270` - File upload (handleFileUpload)
- ✅ `src/components/DataSourcesPanel.tsx:434-443` - File upload (FileDropzone.onDrop)

#### **Error Patterns Detected**
- `out of memory` (case insensitive)
- `failed to allocate`
- `allocation failure` ← Added for DuckDB worker errors
- `3.1 gib/3.1 gib used`
- `memory limit exceeded`
- `unused blocks cannot be evicted`

### 🎯 **Key Benefits**

#### **For Users**
- ✅ **Clear error messages** instead of hidden console errors
- ✅ **Actionable guidance** (reduce file size, simplify queries)
- ✅ **Professional UI** with proper styling and icons
- ✅ **Works in production** (not broken by Terser optimization)

#### **For Developers**
- ✅ **Production-ready** - survives Terser's `drop_console: true`
- ✅ **Simple pattern** - just call `handleOutOfMemoryError(error)` in catch blocks
- ✅ **No complex logic** - always show both modal and toast (no conditional UI)
- ✅ **Debugging preserved** - console.error still runs (removed in production, but that's OK)

### 🚨 **Critical Production Issue: Terser's drop_console**

#### **The Problem**
**Configuration** (`vite.config.ts:30`):
```typescript
build: {
  terserOptions: {
    compress: {
      drop_console: true, // Removes ALL console.* in production
    },
  },
}
```

**Impact on Original Design**:
1. ❌ Console interception code gets removed (contains `console.error`)
2. ❌ `useEffect` with only `console.log` got optimized away
3. ❌ `globalErrorHandler` callback was never registered
4. ❌ Modal never showed in production

#### **The Fix**
**Changed** (`GlobalErrorProvider.tsx:36-48`):
```typescript
// OLD (broken in production):
React.useEffect(() => {
  setGlobalErrorHandler(showOutOfMemoryError);
  console.log('registered'); // ← Terser sees this, might remove entire useEffect
}, []);

// NEW (production-proof):
React.useMemo(() => {
  setGlobalErrorHandler((error) => handlerRef.current(error));
  // NO console.log - Terser can't optimize this away
}, []);
```

**Result**: Handler registration happens during render, no console.log dependency, survives Terser optimization ✅

#### **Additional Strategy: Explicit Error Checking**
Since DuckDB worker errors can't be caught by browser listeners anyway, we add explicit checking:
```typescript
catch (error) {
  handleOutOfMemoryError(error); // Check and show modal if OOM
  throw error; // Continue normal error flow (toast/alert)
}
```

**Benefits**:
- Works regardless of Terser settings ✅
- Catches worker thread errors ✅
- Simple to understand ✅

### 📋 **Console Logging Pattern**

**Development Mode**:
```
🔧 [GLOBAL ERROR HANDLER] Initializing global error handler
✅ [GLOBAL ERROR HANDLER] Global error handler initialized with console interception
❌ [TABLE EXPORT] Export failed for tablename: Error: Out of Memory Error
🚨 [GLOBAL ERROR PROVIDER] Showing Out of Memory error modal
```

**Production Mode** (with `drop_console: true`):
```
(No console logs - all removed by Terser)
(Modal still shows because of useMemo registration + explicit error checking)
```

### 🧪 **Testing Commands**

**Test if modal works in production**:
```javascript
// Test 1: Unhandled promise rejection
Promise.reject(new Error('Out of Memory Error: test'));

// Test 2: Thrown error
setTimeout(() => { throw new Error('Out of Memory Error: test'); }, 100);

// Test 3: Check handler registration
const event = new ErrorEvent('error', {
  error: { message: 'Out of Memory Error: test' }
});
console.log('Handler working:', !window.dispatchEvent(event)); // Should be true
```

### 📦 **File Structure**
```
src/
├── utils/
│   ├── globalErrorHandler.ts      # Core error detection (export handleOutOfMemoryError)
│   ├── exportTable.ts             # Explicit OOM checking
│   ├── exportDatabase.ts          # Explicit OOM checking
│   └── importDuckDB.ts            # Explicit OOM checking
├── components/
│   ├── OutOfMemoryModal.tsx       # User-friendly error modal
│   ├── GlobalErrorProvider.tsx    # React context (useMemo registration)
│   └── DataSourcesPanel.tsx       # Explicit OOM checking (2 places)
├── main.tsx                       # Initialize browser listeners
└── room.tsx                       # Wrap app with GlobalErrorProvider
```

**Status**: ✅ Production-ready - Works in both dev and production builds with `drop_console: true`

---

## Bug Reporting System

**Status**: ❌ **REMOVED** - Bug reporting functionality has been surgically removed from the application

### 🗑️ **Removal Summary**

The bug reporting system has been completely removed from the application as of the latest update. This includes:

- **Bug Report Button**: Removed from AppHeader.tsx
- **Bug Report Modal**: Deleted BugReportModal.tsx component
- **API Route**: Deleted api/send-feedback.js
- **Environment Variables**: Cleaned up Brevo email configuration from env.example

### 📋 **Files Removed/Modified**

#### **Deleted Files:**
- `src/components/BugReportModal.tsx` - Feedback modal component
- `api/send-feedback.js` - Vercel API route for email processing

#### **Modified Files:**
- `src/components/AppHeader.tsx` - Removed bug report button and related state management
- `env.example` - Removed Brevo email configuration variables

### 🎯 **Current Header Structure**

The app header now has a clean three-section layout:
```
┌─────────────────────────────────────────────────────────────────┐
│ Left: "DuckDB Database Runs in Local Browser..."               │
│ Center: "SQL Rooms AI @Tigzig ◆ DuckDB"                        │
│ Right: "Credits: sqlrooms.org ● Custom Deployment"            │
└─────────────────────────────────────────────────────────────────┘
```

### ✅ **Impact Assessment**

- **No Breaking Changes**: All other app functionality remains intact
- **Clean Codebase**: No unused imports or dead code
- **Simplified UI**: Header layout is cleaner without the report button
- **Reduced Dependencies**: No longer depends on Brevo email service

**Status**: ✅ **Removed** - Bug reporting system completely removed without affecting other functionality

---

## Single-File Build System

**Status**: ✅ **Production-ready** - Enables email-able, serverless deployment of the entire app

### 🎯 **Overview**

The app supports two distinct build modes for different deployment scenarios:

1. **Normal Build** (`npm run build`) - Multi-file output for web hosting (Vercel, Netlify, etc.)
2. **Single-File Build** (`npm run build:single-file`) - One self-contained HTML file for email distribution

### 📦 **Build Outputs**

#### **Normal Build** → `dist/` folder
```bash
npm run build

Output:
dist/
├── index.html                     (1.8 KB - small loader)
└── assets/
    ├── index-*.css              (101 KB - styles)
    └── index-*.js               (3.2 MB - app code)
```

**Use Case**: Deploy to web hosting platforms
- Requires web server (cannot double-click to open)
- Optimized for web delivery with separate asset loading
- Used for production deployment on Vercel

#### **Single-File Build** → `dist-single/` folder
```bash
npm run build:single-file

Output:
dist-single/
└── index.html                     (3.4 MB - everything embedded)
```

**Use Case**: Email distribution, offline sharing, serverless deployment
- ✅ Double-clickable - opens directly in browser
- ✅ No server required - all code embedded
- ✅ Email-friendly - single file attachment (~3.4 MB, compresses to ~1 MB)
- ✅ Works offline - except for initial CDN downloads

### 🔧 **Technical Implementation**

#### **Configuration** (`vite.config.ts`)

```typescript
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only use single-file plugin in singlefile mode
    ...(mode === 'singlefile' ? [viteSingleFile()] : []),
  ],
  build: {
    // Use different output directory for single-file build
    outDir: mode === 'singlefile' ? 'dist-single' : 'dist',
    // ... other build config
  },
}))
```

**Key Points**:
- Plugin: `vite-plugin-singlefile` inlines all JS and CSS into HTML
- Separate output directories prevent builds from overwriting each other
- Mode detection via `--mode singlefile` flag

#### **Build Scripts** (`package.json`)

```json
{
  "scripts": {
    "build": "tsc -b && vite build",                           // Normal build
    "build:single-file": "tsc -b && vite build --mode singlefile"  // Single-file build
  }
}
```

### 📊 **File Composition**

The single-file HTML contains:

**Embedded (in the file)**:
- ✅ All React components (compiled and minified)
- ✅ All SQLRooms packages (@sqlrooms/ai, @sqlrooms/duckdb, etc.)
- ✅ All application logic and state management
- ✅ All CSS styles (Tailwind, custom styles)
- ✅ All utility functions and configurations

**Loaded from CDN** (external):
- 📥 React library (~40 KB from unpkg.com)
- 📥 DuckDB-WASM (~10 MB from jsdelivr.net/npm/@duckdb/duckdb-wasm)
- 📥 Web fonts (Roboto from fonts.googleapis.com)
- 📥 FontAwesome icons (from cdnjs.cloudflare.com)

### ⏱️ **Performance Characteristics**

#### **First-Time Load** (no browser cache):
- **Time**: 30 seconds - 3 minutes
- **Why**: Downloading DuckDB WASM (10 MB) + React from CDN
- **User Experience**: "Initializing database" loading screen
- **Network**: Requires internet connection

#### **Subsequent Loads** (cached):
- **Time**: 5-10 seconds
- **Why**: CDN resources cached by browser
- **User Experience**: Same as normal web app
- **Network**: Can work offline (if CDN resources cached)

### 📧 **Email Distribution Workflow**

1. **Build the single-file version**:
   ```bash
   npm run build:single-file
   ```

2. **Locate the file**:
   ```
   dist-single/index.html (3.4 MB)
   ```

3. **Email to users**:
   - Attach `index.html` to email
   - File size: ~3.4 MB (within Gmail 25 MB limit)
   - Compresses to ~1 MB if zipped

4. **User opens the file**:
   - Download attachment
   - Double-click `index.html`
   - Browser opens the app
   - First load: 1-3 minutes (downloading CDN resources)
   - Works exactly like the web version

### 🔒 **Security & Privacy**

**Data stays local**:
- All data processing happens in browser
- Database files stay in browser memory (RAM)
- No data sent to any server (except LLM API calls)
- User's files never leave their computer

**CDN dependencies**:
- React: Loaded from unpkg.com (official npm CDN)
- DuckDB: Loaded from jsdelivr.net (official CDN)
- Both are public, trusted CDN providers

### ⚠️ **Limitations**

1. **Internet required** for first load (to download CDN resources)
2. **File size** (3.4 MB) may be too large for some corporate email systems
3. **Browser compatibility** - Requires modern browser with WASM support
4. **Update distribution** - Users need new file for each update (no auto-updates)

### 🎯 **Use Cases**

**When to use single-file build**:
- ✅ Distributing app to non-technical users via email
- ✅ Offline demos or presentations
- ✅ Client deliverables that need to work without deployment
- ✅ Quick sharing for testing/feedback
- ✅ Archival versions of the app

**When to use normal build**:
- ✅ Production web deployment (Vercel, Netlify)
- ✅ When you need auto-updates
- ✅ When you need faster initial load times
- ✅ When users have reliable server access

### 📋 **Troubleshooting**

**Issue**: CORS errors when opening `dist/index.html`
- **Cause**: You ran `npm run build` instead of `npm run build:single-file`
- **Solution**: Run correct build command, outputs are in different folders

**Issue**: Slow first load (3+ minutes)
- **Cause**: Normal - downloading DuckDB WASM from CDN
- **Solution**: This is expected behavior, subsequent loads are fast

**Issue**: Email bounces due to file size
- **Cause**: 3.4 MB file too large for some systems
- **Solution**: Zip the file (~1 MB) or use file sharing link (Google Drive, Dropbox)

### 🎨 **Single-File Customization System**

**Status**: ✅ **Active** - Environment-aware behavior for local file deployment

#### **Overview**

The single-file build includes intelligent environment detection that customizes the app's behavior based on how it's being accessed:
- **Server environment** (https://): Full functionality with all AI providers
- **Local file** (file://): Optimized for offline use with direct API providers only

#### **Current Implementation**

**1. Environment Detection** (`src/utils/environment.ts`)
- **Method**: `window.location.protocol === 'file:'` detection
- **Reliability**: Industry-standard, 100% reliable across all browsers
- **Usage**: Centralized utility functions used throughout the app
  ```typescript
  isRunningAsLocalFile()  // Returns true if opened as file://
  isRunningOnServer()     // Returns true if http:// or https://
  ```

**2. Model Filtering for Local Files**
- **Location**: `src/models.ts`
- **Behavior**:
  - **Server (http/https)**: Shows all models (OpenAI, Google, Anthropic)
  - **Local file (file://)**: Shows only Google models (direct API, no proxy needed)
- **Reason**: OpenAI requires Vercel serverless proxy (`/api/openai-proxy`) which doesn't work in file:// protocol
- **Default Model**: `gemini-2.5-flash` (works in all environments)

**3. StatCounter Removal for Single-File Build**
- **Location**: `vite.config.ts` + `index.html`
- **Method**: Custom Vite plugin with marker-based removal
- **Behavior**:
  - **Server build** (`npm run build`): StatCounter included
  - **Single-file build** (`npm run build:single-file`): StatCounter excluded
- **How it works**:
  1. Marker comments in `index.html`: `<!-- STATCOUNTER_START -->` ... `<!-- STATCOUNTER_END -->`
  2. Custom plugin `removeStatCounterPlugin()` in `vite.config.ts`
  3. When `mode === 'singlefile'`, regex removes all content between markers
- **Testing**: `grep -i "statcounter" dist-single/SQL-ROOMS-TIGZIG-FULL-APP.html` returns no results
- **Why**: Privacy-friendly offline distribution, no external tracking calls

**4. Download Banner Hiding for Local Files**
- **Location**: `src/components/AppHeader.tsx`
- **Method**: Runtime conditional rendering with React
- **Behavior**:
  - **Server (http/https)**: Download banner visible
  - **Local file (file://)**: Download banner hidden
- **Implementation**:
  ```typescript
  import { isRunningAsLocalFile } from '@/utils/environment';

  {!isRunningAsLocalFile() && (
    <div>
      {/* Download info bar with button and description */}
    </div>
  )}
  ```
- **Reason**: Download button in downloaded file is circular reference - user already has the file they're viewing
- **Testing**: Open single-file build, verify no download banner appears
- **Advantages**:
  - No build-time changes needed (simpler than StatCounter approach)
  - Zero structural DOM changes (no risk of breaking layout)
  - Same environment detection pattern as model filtering
  - Works for both mobile and desktop layouts

**5. Console Debugging**
```javascript
// Console logs help verify environment detection
🌍 [MODELS] Running as local file: true/false
📋 [MODELS] Using LOCAL_FILE_LLM_MODELS (Google only)
📋 [MODELS] Using ALL_LLM_MODELS (OpenAI, Google, Anthropic)
```

#### **Build & Deployment Workflow**

**Step 1: Build Single-File Locally**
```bash
npm run build:single-file
```
Output: `dist-single/SQL-ROOMS-TIGZIG-FULL-APP.html` (3.3 MB)

**Step 2: Copy to Public Folder**
```bash
cp dist-single/SQL-ROOMS-TIGZIG-FULL-APP.html public/
```
*Note*: Vite automatically copies `public/` contents to `dist/` during normal build

**Step 3: Commit & Deploy**
```bash
git add public/SQL-ROOMS-TIGZIG-FULL-APP.html
git commit -m "update single-file build"
git push
```
*Note*: Vercel auto-deploys and serves file from `dist/SQL-ROOMS-TIGZIG-FULL-APP.html`

**Step 4: Download from Production**
Users can download from: `https://sql-rooms.tigzig.com/SQL-ROOMS-TIGZIG-FULL-APP.html`

#### **Git Configuration**

**`.gitignore` Settings:**
```gitignore
dist              # Ignore normal build (Vercel rebuilds it)
!dist-single/     # Include single-file build (needed for manual workflow)
```

**Why this works:**
- Normal `dist/` folder is ignored (Vercel builds it fresh)
- `dist-single/` folder is tracked (manually built offline)
- `public/` folder is tracked (deployed by Vercel)

#### **Technical Details**

**Default Model Configuration:**
- **File**: `src/models.ts` - `DEFAULT_MODEL = 'gemini-2.5-flash'`
- **File**: `src/components/CustomSessionControls.tsx` - Three places ensure consistency:
  1. Line 94: Session creation defaults to `'google'` provider
  2. Line 140: New sessions set to `'gemini-2.5-flash'` model
  3. Line 145-149: BaseURL set to Google API endpoint

**Why Three Places?**
- Session creation sets initial baseURL (prevents wrong API endpoint)
- useEffect sets default model for new sessions (overrides any cached model)
- BaseURL update ensures API calls go to correct endpoint

**File Naming:**
- Production filename: `SQL-ROOMS-TIGZIG-FULL-APP.html`
- Set in `package.json`: Renames `index.html` after build
- Maintained in both `dist-single/` and `public/` folders

#### **Current Customizations**

| Feature | Server Behavior | Local File Behavior | Status |
|---------|----------------|---------------------|--------|
| **Model Selector** | All models visible | Google only | ✅ Active |
| **Default Model** | gemini-2.5-flash | gemini-2.5-flash | ✅ Active |
| **API Endpoint** | Direct/Proxy | Direct only | ✅ Active |
| **StatCounter Tracking** | Included | Excluded | ✅ Active |
| **Download Banner** | Visible | Hidden | ✅ Active |

#### **Testing Checklist**

**Before Deploying Single-File:**

1. **Build the file:**
   ```bash
   npm run build:single-file
   ```

2. **Test locally:**
   - Double-click `dist-single/SQL-ROOMS-TIGZIG-FULL-APP.html`
   - Open browser console
   - Verify: `🌍 [MODELS] Running as local file: true`
   - Verify: Only Google models in selector
   - Verify: Default model is `gemini-2.5-flash`
   - Verify: Download banner is NOT visible
   - Test: Ask a question with Google API key configured

3. **Copy to public and deploy:**
   ```bash
   cp dist-single/SQL-ROOMS-TIGZIG-FULL-APP.html public/
   git add public/SQL-ROOMS-TIGZIG-FULL-APP.html
   git commit -m "update single-file build"
   git push
   ```

4. **Test production:**
   - Visit: `https://sql-rooms.tigzig.com`
   - Verify: Download banner IS visible on website
   - Click "Download Full App" button
   - Save file and double-click to open
   - Verify: Download banner is NOT visible in downloaded file
   - Verify: Same behavior as step 2

### ✅ **Status**

- **Implementation**: Complete
- **Environment Detection**: Active and working
- **Model Filtering**: Active and working
- **StatCounter Removal**: Active and working
- **Download Banner Hiding**: Active and working
- **Testing**: Verified on Windows, Chrome, Firefox, Edge
- **Documentation**: Complete
- **Production Ready**: Yes