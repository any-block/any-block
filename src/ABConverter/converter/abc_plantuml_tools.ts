import type { List_ListItem } from "./abc_list"

// start flag
const KEYWORD_IF = "if "
const KEYWORD_SWITCH = "switch "
const KEYWORD_SWITCH2 = "match "  // python use `match, case, case _` instead of `switch, case, default`
const KEYWORD_WHILE = "while "
const KEYWORD_GROUP = "group "
const KEYWORD_PARTITION = "partition "
const KEYWORD_LANE = "lane "
// middle/end flag
const KEYWORD_ELIF = "elif "
const KEYWORD_ELSEIF = "else if "
const KEYWORD_ELSE = "else"
const KEYWORD_DEFAULT = "default"
const KEYWORD_DEFAULT2 = "case _" // python use `match, case, case _` instead of `switch, case, default`
const KEYWORD_CASE = "case "
// other flag
const BLOCK_START = ":"
const INDENT = "  ";

class Stat {
  content: string;
  level: number;
  constructor(content: string, level: number) {
    this.content = content.trim();
    this.level = level;
  }
  // 判断是否为保留字
  isReservedWord(): boolean {
    return this.content === "start" || this.content === "stop" || this.content === "kill" ||
      this.content === "detach" || this.content === "break" || this.content === "end" ||
      this.content === "fork" || this.content === "fork again" || this.content === "end fork" ||
      this.content === "end merge";
  }

  isStatementOfType(...stateType: string[]): boolean {
    return stateType.some(type => this.content.startsWith(type)) && this.content.endsWith(BLOCK_START);
  }

  takeTagOfStat(type: string): string {
    const condition = this.content.substring(type.length, this.content.length - BLOCK_START.length).trim();
    return condition;
  }
}

type ProcessResult = {
  result: string,
  nextIndex: number
};

const statementTypes = {
  [KEYWORD_IF]: processIfStatement,
  [KEYWORD_SWITCH]: processSwitchStatement,
  [KEYWORD_SWITCH2]: processSwitchStatement,
  [KEYWORD_WHILE]: processWhileStatement,
  [KEYWORD_GROUP]: processGroupStatement,
  [KEYWORD_PARTITION]: processPartitionStatement,
  [KEYWORD_LANE]: processSwimLane
};

// Process main content, recursively process all items
function processBlock(stats: Stat[], index: number, parentLevel: number): ProcessResult {
  let result = "";
  let next = index;
  while (next < stats.length && (parentLevel === -1 || stats[next].level > parentLevel)) {
    const stat = stats[next];

    if (stat.isReservedWord()) {
      result += stat.content + "\n";
      next++;
      continue;
    }

    let processed = false;
    for (const [statType, processor] of Object.entries(statementTypes)) {
      if (stat.isStatementOfType(statType)) {
        const { result: processedResult, nextIndex: nextNext } = processor(stats, next, statType);
        result += processedResult;
        next = nextNext;
        processed = true;
        break;
      }
    }

    if (processed) continue;

    if (stat.content.length > 0) {
      result += `:${stat.content};` + "\n";
    }
    next++;
  }

  return { result, nextIndex: next }
}

// 处理if语句
function processIfStatement(stats: Stat[], index: number): { result: string, nextIndex: number } {
  let result = KEYWORD_IF;
  const stat = stats[index];
  const condition = stat.takeTagOfStat(KEYWORD_IF);
  let nextIndex = index + 1;

  // if body
  if (nextIndex < stats.length && stats[nextIndex].level > stat.level) {
    result += `(${condition}) then (yes)\n`;
    const { result: result2, nextIndex: nextIndex2 } = processBlock(stats, nextIndex, stat.level);
    result += indentContent(result2);
    nextIndex = nextIndex2;
  }

  // Process else and else if branches
  while (nextIndex < stats.length && stats[nextIndex].level === stat.level && stats[nextIndex].isStatementOfType(KEYWORD_ELIF, KEYWORD_ELSEIF, KEYWORD_ELSE)) {
    const branch = stats[nextIndex];
    if (branch.isStatementOfType(KEYWORD_ELSEIF)) { // KEYWORD_ELSEIF must be ahead of ELSE
      const condition = branch.takeTagOfStat(KEYWORD_ELSEIF);
      result += `else if(${condition}) then (yes)\n`;
    } else if (branch.isStatementOfType(KEYWORD_ELIF)) {
      const condition = branch.takeTagOfStat(KEYWORD_ELIF);
      result += `else if(${condition}) then (yes)\n`;
    } else if (branch.isStatementOfType(KEYWORD_ELSE)) {
      result += `else (else)\n`;
    }
    const { result: result2, nextIndex: nextIndex2 } = processBlock(stats, nextIndex + 1, stat.level);
    result += indentContent(result2);
    nextIndex = nextIndex2;
  }

  result += "endif\n";
  return { result, nextIndex };
}

// 处理switch语句
function processSwitchStatement(stats: Stat[], index: number, statType: string): { result: string, nextIndex: number } {
  let result = `switch `;
  const stat = stats[index];
  const condition = stat.takeTagOfStat(statType);
  let nextIndex = index + 1;

  result += `(${condition})\n`;

  let hasDefault = false;
  // Process case/default statements
  while (nextIndex < stats.length && stats[nextIndex].level >= stat.level && stats[nextIndex].isStatementOfType(KEYWORD_CASE, KEYWORD_DEFAULT)) {
    const nextStat = stats[nextIndex];
    nextIndex++;
    if (nextStat.isStatementOfType(KEYWORD_DEFAULT) || nextStat.isStatementOfType(KEYWORD_DEFAULT2)) { // KEYWORD_DEFAULT2 must be ahead of KEYWORD_CASE
      result += `case (default)\n`;
      hasDefault = true;
      const { result: defaultResult, nextIndex: defaultNextIndex } = processBlock(stats, nextIndex, nextStat.level);
      result += indentContent(defaultResult);
      nextIndex = defaultNextIndex;
    } else if (nextStat.isStatementOfType(KEYWORD_CASE)) {
      const caseTag = nextStat.takeTagOfStat(KEYWORD_CASE);
      result += `case (${caseTag})\n`;
      const { result: caseResult, nextIndex: caseNextIndex } = processBlock(stats, nextIndex, nextStat.level);
      result += indentContent(caseResult);
      nextIndex = caseNextIndex;
    } 
  }
  if (!hasDefault) {
    result += "case (default)\n";
  }

  result += "endswitch\n";
  return { result, nextIndex };
}

// 处理while语句
function processWhileStatement(stats: Stat[], index: number): { result: string, nextIndex: number } {
  const stat = stats[index];
  const condition = stat.takeTagOfStat(KEYWORD_WHILE);
  let result = `${KEYWORD_WHILE}(${condition}) is (true)\n`;
  let nextIndex = index + 1;

  // Process while body
  const { result: bodyResult, nextIndex: bodyNextIndex } = processBlock(stats, nextIndex, stat.level);
  result += indentContent(bodyResult);
  nextIndex = bodyNextIndex;

  result += "endwhile\n";
  return { result, nextIndex };
}

// 处理group语句
function processGroupStatement(stats: Stat[], index: number): { result: string, nextIndex: number } {
  const stat = stats[index];
  const groupName = stat.takeTagOfStat(KEYWORD_GROUP);
  let result = `${KEYWORD_GROUP}${groupName}\n`;
  let nextIndex = index + 1;

  // Process group body
  const { result: bodyResult, nextIndex: bodyNextIndex } = processBlock(stats, nextIndex, stat.level);
  result += indentContent(bodyResult);
  nextIndex = bodyNextIndex;

  result += "endgroup\n";
  return { result, nextIndex };
}

// 处理partition语句
function processPartitionStatement(stats: Stat[], index: number): { result: string, nextIndex: number } {
  const stat = stats[index];
  const partitionName = stat.takeTagOfStat(KEYWORD_PARTITION);
  let result = `${KEYWORD_PARTITION}${partitionName} {\n`;
  let nextIndex = index + 1;

  // Process partition body
  const { result: bodyResult, nextIndex: bodyNextIndex } = processBlock(stats, nextIndex, stat.level);
  result += indentContent(bodyResult);
  nextIndex = bodyNextIndex;

  result += "}\n";
  return { result, nextIndex };
}

// 处理swim lane
function processSwimLane(stats: Stat[], index: number): { result: string, nextIndex: number } {
  const stat = stats[index];
  const laneName = stat.takeTagOfStat(KEYWORD_LANE);
  return { result: "|" + laneName + "|\n", nextIndex: index + 1 };
}

// 为内容添加缩进
function indentContent(content: string): string {
  return content.split('\n').filter(x => x !== '').map(line => INDENT + line).join('\n') + "\n";
}

export function list2ActivityDiagramText(listdata: List_ListItem): string {
  let result = "@startuml\n";
  const stats = listdata.map(item => new Stat(item.content.trim(), item.level));
  const { result: bodyResult } = processBlock(stats, 0, -1);
  result += bodyResult;
  result += "@enduml";
  return result;
}
