import { Locator, Page, expect } from '@playwright/test';

import { ConfirmActionModalPage } from './confirm-action-modal.page';

export class CreateQuizPage {
  readonly titleInput: Locator;
  readonly startsAtInput: Locator;
  readonly endsAtInput: Locator;
  readonly publishBtn: Locator;
  readonly addQuestionBtn: Locator;
  readonly courseSelect: Locator;
  readonly questionTypeSelect: Locator;

  readonly mcqForm: Locator;
  readonly mcqTitleArea: Locator;
  readonly mcqChoiceInputs: Locator;
  readonly mcqRadios: Locator;
  readonly mcqDeleteButtons: Locator;
  readonly mcqAddChoiceBtn: Locator;
  readonly mcqMarksInput: Locator;

  readonly essayTitleArea: Locator;
  readonly essayReferenceArea: Locator;
  readonly essayMarksInput: Locator;

  readonly tfTitleArea: Locator;
  readonly tfRadios: Locator;
  readonly tfMarksInput: Locator;

  private confirmModalPage: ConfirmActionModalPage;

  constructor(private page: Page) {
    this.confirmModalPage = new ConfirmActionModalPage(page);

    this.titleInput = page.locator('#quiz-title');
    this.startsAtInput = page.locator('#quiz-starts-at input');
    this.endsAtInput = page.locator('#quiz-ends-at input');
    this.publishBtn = page.locator('button:has-text("Publish Quiz")');
    this.addQuestionBtn = page.locator('qn-add-question:not(.pill-style) button');
    this.courseSelect = page.locator('p-select[inputid="quiz-course"]');
    this.questionTypeSelect = page.locator(
      'qn-add-question:not(.pill-style) p-select[inputid="questionType"]',
    );

    this.mcqForm = page.locator('qn-mcq-form');
    this.mcqTitleArea = page.locator('qn-mcq-form qn-question-title textarea');
    this.mcqChoiceInputs = page.locator('qn-mcq-form input.choice-input');
    this.mcqRadios = page.locator('qn-mcq-form p-radiobutton input[type="radio"]');
    this.mcqDeleteButtons = page.locator('qn-mcq-form qn-delete-button button');
    this.mcqAddChoiceBtn = page.locator('qn-mcq-form button:has-text("+Add Choice")');
    this.mcqMarksInput = page.locator('qn-question-header input[type="number"]').nth(0);

    this.essayTitleArea = page.locator('qn-essay-form qn-question-title textarea');
    this.essayReferenceArea = page.locator('qn-essay-form textarea#answerReference');
    this.essayMarksInput = page.locator('qn-question-header input[type="number"]').nth(1);

    this.tfTitleArea = page.locator('qn-tf-form qn-question-title textarea');
    this.tfRadios = page.locator('qn-tf-form p-radiobutton input[type="radio"]');
    this.tfMarksInput = page.locator('qn-question-header input[type="number"]').nth(2);
  }

  async goto(): Promise<void> {
    await this.page.goto('/instructor/create-quiz');
  }

  async selectCourse(courseName: string): Promise<void> {
    await this.courseSelect.click();
    const option = this.page.locator('.p-select-option:visible').filter({ hasText: courseName });
    await expect(option).toBeVisible();
    await option.click({ force: true });
  }

  async selectQuestionType(typeText: string): Promise<void> {
    // Scroll the content area to the bottom to stabilize the visibility observer
    await this.page.locator('.base-layout__content').evaluate((el) => {
      el.scrollTo(0, el.scrollHeight);
    });
    // Wait until the sticky container is detached to guarantee DOM stability
    await expect(this.page.locator('.add-question-sticky-container')).not.toBeAttached({
      timeout: 3000,
    });
    await this.page.waitForTimeout(250);

    await this.questionTypeSelect.click();

    const option = this.page.locator('.p-select-option:visible').filter({ hasText: typeText });
    await expect(option).toBeVisible();
    await option.click({ force: true });
    // Wait for PrimeNG to commit the selection (label span updates)
    await expect(this.questionTypeSelect.locator('.p-select-label')).toContainText(typeText, {
      timeout: 5000,
    });
  }

  async addQuizMetadata(title: string, startsInMinutes = 0, endsInMinutes = 30): Promise<void> {
    await this.selectCourse('Data Structures & Algorithms');
    await this.titleInput.fill(title);
    await this.titleInput.blur();

    const formatTime = (d: Date) => {
      return d
        .toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        .replace(',', '');
    };

    const starts = new Date();
    starts.setSeconds(starts.getSeconds() + 10);
    if (startsInMinutes !== 0) {
      starts.setMinutes(starts.getMinutes() + startsInMinutes);
    }
    const ends = new Date();
    ends.setMinutes(ends.getMinutes() + endsInMinutes);

    await this.startsAtInput.click();
    await this.startsAtInput.press('Control+A');
    await this.startsAtInput.pressSequentially(formatTime(starts));
    await this.startsAtInput.press('Enter');

    await this.endsAtInput.click();
    await this.endsAtInput.press('Control+A');
    await this.endsAtInput.pressSequentially(formatTime(ends));
    await this.endsAtInput.press('Enter');
  }

  async createQuizViaUI(
    title: string,
    questionTypes: {
      type: 'mcq' | 'tf' | 'essay';
      text: string;
      marks: string;
      choices?: string[];
      correctChoiceIndex?: number;
      correctTf?: boolean;
      expectedAnswer?: string;
    }[],
    startsInMinutes = 0,
    endsInMinutes = 30,
  ): Promise<void> {
    await this.goto();
    await this.addQuizMetadata(title, startsInMinutes, endsInMinutes);

    for (const q of questionTypes) {
      if (q.type === 'mcq') {
        await this.selectQuestionType('Multiple Choice');
        await this.addQuestionBtn.click();

        const questionDiv = this.page.locator('div.question').last();
        const questionTitleInput = questionDiv.locator(
          'qn-mcq-form textarea.question-title__input',
        );
        await questionTitleInput.waitFor({ state: 'visible' });
        await questionTitleInput.fill(q.text);
        await questionTitleInput.blur();

        const choices = q.choices || ['Option A', 'Option B'];
        const choiceInputs = questionDiv.locator('qn-mcq-form input.choice-input');
        for (let i = 0; i < choices.length; i++) {
          if (i >= 2) {
            await questionDiv.locator('qn-mcq-form button:has-text("+Add Choice")').click();
          }
          const choiceInput = choiceInputs.nth(i);
          await choiceInput.fill(choices[i]);
          await choiceInput.blur();
        }

        const radioIndex = q.correctChoiceIndex !== undefined ? q.correctChoiceIndex : 0;
        await questionDiv
          .locator('qn-mcq-form p-radiobutton input[type="radio"]')
          .nth(radioIndex)
          .click({ force: true });

        const marksInput = questionDiv.locator('qn-question-header input[type="number"]');
        await marksInput.fill(q.marks);
        await marksInput.blur();
      } else if (q.type === 'tf') {
        await this.selectQuestionType('True/False');
        await this.addQuestionBtn.click();

        const questionDiv = this.page.locator('div.question').last();
        const questionTitleInput = questionDiv.locator('qn-tf-form textarea.question-title__input');
        await questionTitleInput.waitFor({ state: 'visible' });
        await questionTitleInput.fill(q.text);
        await questionTitleInput.blur();

        const selectTrue = q.correctTf !== false;
        const radioInput = questionDiv
          .locator('qn-tf-form input[type="radio"]')
          .nth(selectTrue ? 0 : 1);
        await radioInput.click({ force: true });

        const marksInput = questionDiv.locator('qn-question-header input[type="number"]');
        await marksInput.fill(q.marks);
        await marksInput.blur();
      } else if (q.type === 'essay') {
        await this.selectQuestionType('Essay');
        await this.addQuestionBtn.click();

        const questionDiv = this.page.locator('div.question').last();
        const questionTitleInput = questionDiv.locator(
          'qn-essay-form textarea.question-title__input',
        );
        await questionTitleInput.waitFor({ state: 'visible' });
        await questionTitleInput.fill(q.text);
        await questionTitleInput.blur();

        const answerReferenceInput = questionDiv.locator('qn-essay-form textarea#answerReference');
        await answerReferenceInput.fill(q.expectedAnswer || 'Expected answer text');
        await answerReferenceInput.blur();

        const marksInput = questionDiv.locator('qn-question-header input[type="number"]');
        await marksInput.fill(q.marks);
        await marksInput.blur();
      }
    }

    await expect(this.publishBtn).toBeEnabled({ timeout: 10000 });
    await this.publishBtn.click();
    await this.confirmModalPage.confirm('publish', 'Yes, Publish Quiz');
  }
}
