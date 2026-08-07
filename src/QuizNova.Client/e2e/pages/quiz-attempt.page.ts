import { Locator, Page, expect } from '@playwright/test';

import { ConfirmActionModalPage } from './confirm-action-modal.page';

export class QuizAttemptPage {
  readonly sidebarQuizzesTab: Locator;
  readonly sidebarResultsTab: Locator;
  readonly tableRows: Locator;

  readonly headerTitle: Locator;
  readonly headerQuestionCount: Locator;
  readonly submitButton: Locator;
  readonly saveAnswerButton: Locator;
  readonly essayTextareas: Locator;
  readonly questionHeader: Locator;
  readonly questionHeaderTag: Locator;
  readonly mcqTag: Locator;
  readonly tfTag: Locator;
  readonly essayTag: Locator;
  readonly mcqOptions: Locator;
  readonly tfOptions: Locator;
  readonly nextButton: Locator;
  readonly navigatorButtons: Locator;

  readonly seeResultsButton: Locator;
  readonly operationFailed: Locator;

  private confirmModalPage: ConfirmActionModalPage;

  constructor(private page: Page) {
    this.sidebarQuizzesTab = page.locator('qn-tab').filter({ hasText: 'Quizzes' }).locator('a');
    this.sidebarResultsTab = page.locator('qn-tab').filter({ hasText: 'Results' }).locator('a');
    this.tableRows = page.locator('p-table tbody tr');

    this.confirmModalPage = new ConfirmActionModalPage(page);

    this.headerTitle = page.locator('qn-quiz-attempt-header h1');
    this.headerQuestionCount = page.locator('qn-quiz-attempt-header p');
    this.submitButton = page.locator('button:has-text("Submit Quiz")');
    this.saveAnswerButton = page.locator('button:has-text("Save Answer")');
    this.essayTextareas = page.locator('qn-essay-attempt textarea');
    this.questionHeader = page.locator('qn-question-attempt-header');
    this.questionHeaderTag = page.locator('qn-question-attempt-header p').first();
    this.mcqTag = page.locator('qn-question-attempt-header .mcq-tag');
    this.tfTag = page.locator('qn-question-attempt-header .question-tag');
    this.essayTag = page.locator('qn-question-attempt-header .essay-tag');
    this.mcqOptions = page.locator('qn-mcq-attempt button.option');
    this.tfOptions = page.locator('qn-tf-attempt button.option');
    this.nextButton = page.locator('qn-navigation-buttons button:has-text("Next")');
    this.navigatorButtons = page.locator('qn-questions-navigator button');

    this.operationFailed = page.locator('qn-operation-failed');
    this.seeResultsButton = page.locator('qn-quiz-finished-message button:has-text("See Results")');
  }

  async clickQuizzesTab(): Promise<void> {
    await this.sidebarQuizzesTab.click({ force: true });
  }

  async clickResultsTab(): Promise<void> {
    await this.sidebarResultsTab.click({ force: true });
  }

  getQuizRow(title: string): Locator {
    return this.tableRows.filter({ hasText: title });
  }

  async startQuiz(title: string): Promise<void> {
    const row = this.getQuizRow(title);
    await row.locator('button.start-btn:has-text("Start Quiz")').click();
    await this.confirmModalPage.confirm('start', 'Yes, Start Quiz');
  }

  async continueQuiz(title: string): Promise<void> {
    const row = this.getQuizRow(title);
    await row.locator('a.start-btn:has-text("Continue")').click();
  }

  async saveAnswer(): Promise<void> {
    await this.saveAnswerButton.click();
    // Wait for the "Saved" state or ensure loading completes
    await expect(this.saveAnswerButton).toHaveText(/✓ Saved|Save Answer/);
  }

  async submitQuiz(): Promise<void> {
    await this.submitButton.click();
    await this.confirmModalPage.confirm('submit', 'Yes, Submit Quiz');
  }

  async selectMcqOption(optionIndex: number): Promise<void> {
    await this.mcqOptions.nth(optionIndex).click();
  }

  async selectTfOption(value: 'True' | 'False'): Promise<void> {
    await this.tfOptions.filter({ hasText: value }).click();
  }

  async fillEssayAnswer(text: string): Promise<void> {
    await this.essayTextareas.fill(text);
  }

  async answerCurrentQuestion(questionType: 'mcq' | 'tf' | 'essay'): Promise<void> {
    if (questionType === 'mcq') {
      await this.selectMcqOption(0);
    } else if (questionType === 'tf') {
      await this.selectTfOption('True');
    } else if (questionType === 'essay') {
      await this.fillEssayAnswer('Test essay response content here');
    }
    await this.saveAnswer();
  }
}
