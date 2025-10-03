// Challenge Evaluation and Scoring System

import type { 
  EvaluationResult, 
  EvaluationCriteria, 
  TestCase
} from '@/types/analytics';

export interface EvaluationOptions {
  enableAIAnalysis?: boolean;
  strictMode?: boolean;
  timeoutMs?: number;
  memoryLimitMB?: number;
}

export interface EvaluationSummary {
  totalScore: number;
  passed: boolean;
  testCaseResults: EvaluationResult[];
  criteriaScores: { [criteriaName: string]: number };
  feedback: string[];
  suggestions: string[];
  executionStats: {
    totalTime: number;
    averageTime: number;
    memoryUsed: number;
  };
}

export class ChallengeEvaluator {
  /**
   * Evaluates a challenge submission against test cases and criteria
   */
  static async evaluateSubmission(
    code: string,
    language: string,
    testCases: TestCase[],
    evaluationCriteria: EvaluationCriteria[],
    options: EvaluationOptions = {}
  ): Promise<EvaluationSummary> {
    const {
      enableAIAnalysis = true,
      strictMode = false,
      timeoutMs = 5000,
      memoryLimitMB = 128
    } = options;

    // Execute test cases
    const testCaseResults = await this.executeTestCases(
      code,
      language,
      testCases,
      { timeoutMs, memoryLimitMB }
    );

    // Calculate criteria scores
    const criteriaScores = await this.calculateCriteriaScores(
      code,
      language,
      testCaseResults,
      evaluationCriteria,
      enableAIAnalysis
    );

    // Calculate total score
    const totalScore = this.calculateTotalScore(criteriaScores, evaluationCriteria);

    // Determine pass/fail
    const passed = this.determinePassStatus(testCaseResults, totalScore, strictMode);

    // Generate feedback and suggestions
    const feedback = this.generateFeedback(testCaseResults, criteriaScores, evaluationCriteria);
    const suggestions = this.generateSuggestions(testCaseResults, criteriaScores, code);

    // Calculate execution statistics
    const executionStats = this.calculateExecutionStats(testCaseResults);

    return {
      totalScore,
      passed,
      testCaseResults,
      criteriaScores,
      feedback,
      suggestions,
      executionStats
    };
  }

  /**
   * Executes test cases against the submitted code
   */
  private static async executeTestCases(
    code: string,
    language: string,
    testCases: TestCase[],
    options: { timeoutMs: number; memoryLimitMB: number }
  ): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        const startTime = Date.now();
        
        // Execute the code with the test case input
        const result = await this.executeCode(code, language, testCase.input, options);
        
        const executionTime = Date.now() - startTime;
        const passed = this.compareOutputs(result.output, testCase.expectedOutput);
        
        results.push({
          testCaseId: `test_${i}`,
          passed,
          actualOutput: result.output,
          executionTime,
          errorMessage: result.error,
          score: passed ? testCase.weight * 100 : 0
        });
      } catch (error) {
        results.push({
          testCaseId: `test_${i}`,
          passed: false,
          actualOutput: '',
          executionTime: options.timeoutMs,
          errorMessage: error instanceof Error ? error.message : 'Unknown execution error',
          score: 0
        });
      }
    }

    return results;
  }

  /**
   * Executes code in a sandboxed environment (mock implementation)
   */
  private static async executeCode(
    code: string,
    language: string,
    input: string,
    options: { timeoutMs: number; memoryLimitMB: number }
  ): Promise<{ output: string; error?: string }> {
    // This is a mock implementation. In a real system, this would:
    // 1. Use a secure sandbox environment (Docker, VM, etc.)
    // 2. Support multiple programming languages
    // 3. Enforce time and memory limits
    // 4. Capture stdout/stderr
    
    try {
      // For JavaScript/TypeScript, we can use a simple eval approach for demo
      if (language === 'javascript' || language === 'typescript') {
        return await this.executeJavaScript(code, input, options);
      }
      
      // For other languages, return a mock result
      return {
        output: 'Mock output for ' + language,
        error: undefined
      };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  /**
   * Executes JavaScript code (simplified for demo purposes)
   */
  private static async executeJavaScript(
    code: string,
    input: string,
    options: { timeoutMs: number }
  ): Promise<{ output: string; error?: string }> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          output: '',
          error: 'Execution timeout'
        });
      }, options.timeoutMs);

      try {
        // Create a safe execution context
        const safeCode = this.createSafeJavaScriptContext(code, input);
        
        // Execute with eval (in a real system, use a proper sandbox)
        const result = eval(safeCode);
        
        clearTimeout(timeout);
        resolve({
          output: String(result),
          error: undefined
        });
      } catch (error) {
        clearTimeout(timeout);
        resolve({
          output: '',
          error: error instanceof Error ? error.message : 'Runtime error'
        });
      }
    });
  }

  /**
   * Creates a safe JavaScript execution context
   */
  private static createSafeJavaScriptContext(code: string, input: string): string {
    // This is a simplified approach. A real implementation would use a proper sandbox.
    return `
      (function() {
        const input = ${JSON.stringify(input)};
        ${code}
        
        // Try to find and execute the main function
        if (typeof solution === 'function') {
          return solution(input);
        } else if (typeof main === 'function') {
          return main(input);
        } else {
          // Try to execute the code directly
          return eval(input);
        }
      })()
    `;
  }

  /**
   * Compares actual output with expected output
   */
  private static compareOutputs(actual: string, expected: string): boolean {
    // Normalize whitespace and compare
    const normalizeOutput = (output: string) => 
      output.trim().replace(/\s+/g, ' ').toLowerCase();
    
    return normalizeOutput(actual) === normalizeOutput(expected);
  }

  /**
   * Calculates scores for each evaluation criteria
   */
  private static async calculateCriteriaScores(
    code: string,
    language: string,
    testResults: EvaluationResult[],
    criteria: EvaluationCriteria[],
    enableAIAnalysis: boolean
  ): Promise<{ [criteriaName: string]: number }> {
    const scores: { [criteriaName: string]: number } = {};

    for (const criterion of criteria) {
      switch (criterion.name.toLowerCase()) {
        case 'correctness':
          scores[criterion.name] = this.calculateCorrectnessScore(testResults);
          break;
        case 'efficiency':
          scores[criterion.name] = this.calculateEfficiencyScore(testResults, code);
          break;
        case 'code quality':
          scores[criterion.name] = this.calculateCodeQualityScore(code, language);
          break;
        case 'best practices':
          scores[criterion.name] = this.calculateBestPracticesScore(code, language);
          break;
        default:
          scores[criterion.name] = this.calculateGenericScore(testResults);
      }
    }

    // Enhance with AI analysis if enabled
    if (enableAIAnalysis) {
      const aiScores = await this.getAIAnalysisScores(code, language);
      Object.assign(scores, aiScores);
    }

    return scores;
  }

  /**
   * Calculates correctness score based on test results
   */
  private static calculateCorrectnessScore(testResults: EvaluationResult[]): number {
    if (testResults.length === 0) return 0;
    
    const passedTests = testResults.filter(result => result.passed).length;
    return (passedTests / testResults.length) * 100;
  }

  /**
   * Calculates efficiency score based on execution time and code analysis
   */
  private static calculateEfficiencyScore(testResults: EvaluationResult[], code: string): number {
    // Base score on execution time
    const avgExecutionTime = testResults.reduce((sum, result) => sum + (result.executionTime || 0), 0) / testResults.length;
    let score = Math.max(0, 100 - (avgExecutionTime / 100)); // Penalize slow execution
    
    // Analyze code for efficiency patterns
    const codeAnalysis = this.analyzeCodeEfficiency(code);
    score = (score + codeAnalysis) / 2;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates code quality score
   */
  private static calculateCodeQualityScore(code: string, language: string): number {
    let score = 100;
    
    // Check for basic quality indicators
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Penalize very long lines
    const longLines = nonEmptyLines.filter(line => line.length > 120);
    score -= longLines.length * 5;
    
    // Reward comments
    const commentLines = nonEmptyLines.filter(line => 
      line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')
    );
    score += Math.min(commentLines.length * 2, 10);
    
    // Check for consistent indentation
    if (this.hasConsistentIndentation(lines)) {
      score += 5;
    } else {
      score -= 10;
    }
    
    // Language-specific checks
    if (language === 'javascript' || language === 'typescript') {
      score += this.analyzeJavaScriptQuality(code);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates best practices score
   */
  private static calculateBestPracticesScore(code: string, language: string): number {
    let score = 80; // Start with a good base score
    
    // Check for common best practices
    if (language === 'javascript' || language === 'typescript') {
      // Check for const/let usage over var
      if (code.includes('var ')) score -= 10;
      if (code.includes('const ') || code.includes('let ')) score += 5;
      
      // Check for arrow functions
      if (code.includes('=>')) score += 5;
      
      // Check for proper error handling
      if (code.includes('try') && code.includes('catch')) score += 10;
      
      // Check for meaningful variable names
      if (this.hasMeaningfulVariableNames(code)) score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates generic score for unknown criteria
   */
  private static calculateGenericScore(testResults: EvaluationResult[]): number {
    return this.calculateCorrectnessScore(testResults);
  }

  /**
   * Gets AI analysis scores (mock implementation)
   */
  private static async getAIAnalysisScores(_code: string, _language: string): Promise<{ [key: string]: number }> {
    // This would integrate with the existing AI analysis system
    // For now, return mock scores
    return {
      'creativity': Math.random() * 40 + 60, // 60-100
      'maintainability': Math.random() * 30 + 70, // 70-100
    };
  }

  /**
   * Analyzes code efficiency patterns
   */
  private static analyzeCodeEfficiency(code: string): number {
    let score = 80;
    
    // Check for nested loops (potential O(n²) or worse)
    const nestedLoopPattern = /for\s*\([^}]*for\s*\(/g;
    const nestedLoops = (code.match(nestedLoopPattern) || []).length;
    score -= nestedLoops * 15;
    
    // Check for efficient data structures usage
    if (code.includes('Map') || code.includes('Set')) score += 10;
    if (code.includes('.indexOf(') && code.includes('for')) score -= 5; // Inefficient search in loop
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Analyzes JavaScript-specific quality patterns
   */
  private static analyzeJavaScriptQuality(code: string): number {
    let bonus = 0;
    
    // Check for modern JavaScript features
    if (code.includes('...')) bonus += 3; // Spread operator
    if (code.includes('?.')) bonus += 3; // Optional chaining
    if (code.includes('??')) bonus += 3; // Nullish coalescing
    
    // Check for function declarations vs expressions
    if (code.includes('function ')) bonus += 2;
    
    return bonus;
  }

  /**
   * Checks for consistent indentation
   */
  private static hasConsistentIndentation(lines: string[]): boolean {
    const indentations = lines
      .filter(line => line.trim().length > 0)
      .map(line => line.match(/^\s*/)?.[0].length || 0)
      .filter(indent => indent > 0);
    
    if (indentations.length === 0) return true;
    
    // Check if all indentations are multiples of the same base
    const baseIndent = Math.min(...indentations);
    return indentations.every(indent => indent % baseIndent === 0);
  }

  /**
   * Checks for meaningful variable names
   */
  private static hasMeaningfulVariableNames(code: string): boolean {
    const variablePattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const variables = [];
    let match;
    
    while ((match = variablePattern.exec(code)) !== null) {
      variables.push(match[1]);
    }
    
    // Check if most variables have meaningful names (length > 2, not just letters)
    const meaningfulVars = variables.filter(name => 
      name.length > 2 && !/^[a-z]+$/.test(name) && !['tmp', 'temp', 'val'].includes(name)
    );
    
    return variables.length === 0 || meaningfulVars.length / variables.length >= 0.7;
  }

  /**
   * Calculates total weighted score
   */
  private static calculateTotalScore(
    criteriaScores: { [criteriaName: string]: number },
    criteria: EvaluationCriteria[]
  ): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const criterion of criteria) {
      const score = criteriaScores[criterion.name] || 0;
      totalScore += score * criterion.weight;
      totalWeight += criterion.weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Determines if the submission passes
   */
  private static determinePassStatus(
    testResults: EvaluationResult[],
    totalScore: number,
    strictMode: boolean
  ): boolean {
    const passThreshold = strictMode ? 80 : 60;
    const requiredTestsPassed = strictMode ? 1.0 : 0.7;
    
    const passedTests = testResults.filter(result => result.passed).length;
    const passRate = testResults.length > 0 ? passedTests / testResults.length : 0;
    
    return totalScore >= passThreshold && passRate >= requiredTestsPassed;
  }

  /**
   * Generates feedback based on evaluation results
   */
  private static generateFeedback(
    testResults: EvaluationResult[],
    criteriaScores: { [criteriaName: string]: number },
    criteria: EvaluationCriteria[]
  ): string[] {
    const feedback: string[] = [];
    
    // Test results feedback
    const passedTests = testResults.filter(result => result.passed).length;
    const totalTests = testResults.length;
    
    if (passedTests === totalTests) {
      feedback.push('🎉 Excellent! All test cases passed.');
    } else if (passedTests > totalTests * 0.7) {
      feedback.push(`✅ Good work! ${passedTests}/${totalTests} test cases passed.`);
    } else {
      feedback.push(`⚠️ ${passedTests}/${totalTests} test cases passed. Review the failing cases.`);
    }
    
    // Criteria feedback
    for (const criterion of criteria) {
      const score = criteriaScores[criterion.name] || 0;
      
      if (score >= 90) {
        feedback.push(`🌟 Outstanding ${criterion.name.toLowerCase()}!`);
      } else if (score >= 70) {
        feedback.push(`👍 Good ${criterion.name.toLowerCase()}.`);
      } else if (score >= 50) {
        feedback.push(`📈 ${criterion.name} needs improvement.`);
      } else {
        feedback.push(`🔧 Focus on improving ${criterion.name.toLowerCase()}.`);
      }
    }
    
    return feedback;
  }

  /**
   * Generates improvement suggestions
   */
  private static generateSuggestions(
    testResults: EvaluationResult[],
    criteriaScores: { [criteriaName: string]: number },
    code: string
  ): string[] {
    const suggestions: string[] = [];
    
    // Test-based suggestions
    const failedTests = testResults.filter(result => !result.passed);
    if (failedTests.length > 0) {
      suggestions.push('Review the failing test cases and check your logic for edge cases.');
      
      if (failedTests.some(test => test.errorMessage?.includes('timeout'))) {
        suggestions.push('Consider optimizing your algorithm to reduce execution time.');
      }
    }
    
    // Criteria-based suggestions
    if (criteriaScores['Efficiency'] < 70) {
      suggestions.push('Look for opportunities to optimize your algorithm\'s time complexity.');
    }
    
    if (criteriaScores['Code Quality'] < 70) {
      suggestions.push('Improve code readability with better variable names and comments.');
    }
    
    if (criteriaScores['Best Practices'] < 70) {
      suggestions.push('Follow language-specific best practices and conventions.');
    }
    
    // Code-specific suggestions
    if (code.includes('var ')) {
      suggestions.push('Use const or let instead of var for better scoping.');
    }
    
    if (!code.includes('//') && !code.includes('/*')) {
      suggestions.push('Add comments to explain complex logic.');
    }
    
    return suggestions;
  }

  /**
   * Calculates execution statistics
   */
  private static calculateExecutionStats(testResults: EvaluationResult[]): {
    totalTime: number;
    averageTime: number;
    memoryUsed: number;
  } {
    const times = testResults.map(result => result.executionTime || 0);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = times.length > 0 ? totalTime / times.length : 0;
    
    return {
      totalTime,
      averageTime,
      memoryUsed: 0, // Would be calculated in a real sandbox environment
    };
  }
}