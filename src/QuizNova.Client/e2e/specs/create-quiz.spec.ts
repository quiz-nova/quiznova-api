import { test, expect, type Page } from '@playwright/test';

import { SeededCredentials } from '../helpers/SeededCredentials';
import { ConfirmActionModalPage } from '../pages/confirm-action-modal.page';
import { CreateQuizPage } from '../pages/create-quiz.page';
import { LoginPage } from '../pages/login.page';

async function addQuizContent(createQuizPage: CreateQuizPage) {
  await createQuizPage.selectCourse('Data Structures & Algorithms');
  await createQuizPage.titleInput.fill('E2E Guard Test Quiz');
  await createQuizPage.titleInput.blur();
}

async function clickSidebarTab(page: Page, name: string) {
  await page.locator('qn-tab').filter({ hasText: name }).locator('a').click();
}

test.describe('Quiz Creation E2E & Validations', () => {
  let createQuizPage: CreateQuizPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(
      SeededCredentials.instructor.email,
      SeededCredentials.instructor.password,
      'Instructor',
    );

    await expect(page).toHaveURL('/instructor/dashboard');

    createQuizPage = new CreateQuizPage(page);
    await createQuizPage.goto();
  });

  test('should disable Add Question when no course is selected and enable when selected', async () => {
    await expect(createQuizPage.addQuestionBtn).toBeDisabled();
    await expect(createQuizPage.publishBtn).toBeDisabled();

    await createQuizPage.selectCourse('Data Structures & Algorithms');

    await expect(createQuizPage.addQuestionBtn).toBeEnabled();
    await expect(createQuizPage.publishBtn).toBeDisabled();
  });

  test('should validate Quiz Title and time interval constraints', async ({ page }) => {
    await createQuizPage.selectCourse('Data Structures & Algorithms');

    await createQuizPage.titleInput.fill('ab');
    await createQuizPage.titleInput.blur();
    await expect(page.locator('qn-field-error#quiz-title-minlength-error')).toContainText(
      'Quiz title must be at least 3 characters.',
    );
    await expect(createQuizPage.publishBtn).toBeDisabled();

    await createQuizPage.titleInput.fill('a'.repeat(31));
    await createQuizPage.titleInput.blur();
    await expect(page.locator('qn-field-error#quiz-title-maxlength-error')).toContainText(
      'Quiz title cannot exceed 30 characters.',
    );
    await expect(createQuizPage.publishBtn).toBeDisabled();

    await createQuizPage.titleInput.fill('Valid Quiz Title');
    await createQuizPage.titleInput.blur();

    await createQuizPage.startsAtInput.click();
    await createQuizPage.startsAtInput.press('Control+A');
    await createQuizPage.startsAtInput.pressSequentially('12/12/2026 12:00 PM');
    await createQuizPage.startsAtInput.press('Enter');

    await createQuizPage.endsAtInput.click();
    await createQuizPage.endsAtInput.press('Control+A');
    await createQuizPage.endsAtInput.pressSequentially('12/12/2026 11:50 AM');
    await createQuizPage.endsAtInput.press('Enter');

    await expect(page.locator('qn-field-error#ends-at-before-start-error')).toContainText(
      'End time must be after start time.',
    );
    await expect(createQuizPage.publishBtn).toBeDisabled();

    await createQuizPage.endsAtInput.click();
    await createQuizPage.endsAtInput.press('Control+A');
    await createQuizPage.endsAtInput.pressSequentially('12/12/2026 12:05 PM');
    await createQuizPage.endsAtInput.press('Enter');

    await expect(page.locator('qn-field-error#ends-at-less-than-ten-error')).toContainText(
      'The difference between start and end time must be at least 10 minutes.',
    );
    await expect(createQuizPage.publishBtn).toBeDisabled();

    await createQuizPage.startsAtInput.click();
    await createQuizPage.startsAtInput.press('Control+A');
    await createQuizPage.startsAtInput.pressSequentially('01/01/2020 10:00 AM');
    await createQuizPage.startsAtInput.press('Enter');

    await expect(page.locator('qn-field-error#starts-at-past-error')).toContainText(
      'Start time cannot be in the past.',
    );
    await expect(createQuizPage.publishBtn).toBeDisabled();
  });

  test('should handle MCQ choice controls, selection of empty choice, and limits', async () => {
    await createQuizPage.selectCourse('Data Structures & Algorithms');

    await createQuizPage.addQuestionBtn.click();

    await expect(createQuizPage.mcqForm).toBeVisible();

    await expect(createQuizPage.mcqDeleteButtons).toHaveCount(2);
    await expect(createQuizPage.mcqDeleteButtons.nth(0)).toBeDisabled();
    await expect(createQuizPage.mcqDeleteButtons.nth(1)).toBeDisabled();

    await createQuizPage.mcqAddChoiceBtn.click();
    await createQuizPage.mcqAddChoiceBtn.click();
    await createQuizPage.mcqAddChoiceBtn.click();

    await expect(createQuizPage.mcqAddChoiceBtn).toBeDisabled();

    await expect(createQuizPage.mcqDeleteButtons.nth(0)).toBeEnabled();

    await createQuizPage.mcqRadios.nth(4).click({ force: true });
    await expect(createQuizPage.mcqRadios.nth(4)).toBeChecked();

    await createQuizPage.mcqChoiceInputs.nth(4).fill('Special Fifth Option');

    await createQuizPage.mcqForm.locator('qn-delete-button').nth(4).click();

    await expect(createQuizPage.mcqChoiceInputs).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      await expect(createQuizPage.mcqRadios.nth(i)).not.toBeChecked();
    }
  });

  test('should successfully publish a quiz with MCQ, TF, and Essay questions (Happy Path)', async ({
    page,
  }) => {
    await createQuizPage.selectCourse('Data Structures & Algorithms');

    await createQuizPage.titleInput.fill('E2E Integration Quiz');
    await createQuizPage.titleInput.blur();

    const futureStart = new Date();
    futureStart.setMinutes(futureStart.getMinutes() + 5);
    const futureEnd = new Date();
    futureEnd.setHours(futureEnd.getHours() + 2);

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

    await createQuizPage.startsAtInput.click();
    await createQuizPage.startsAtInput.press('Control+A');
    await createQuizPage.startsAtInput.pressSequentially(formatTime(futureStart));
    await createQuizPage.startsAtInput.press('Enter');

    await createQuizPage.endsAtInput.click();
    await createQuizPage.endsAtInput.press('Control+A');
    await createQuizPage.endsAtInput.pressSequentially(formatTime(futureEnd));
    await createQuizPage.endsAtInput.press('Enter');

    await createQuizPage.addQuestionBtn.click();

    await createQuizPage.mcqTitleArea.fill('What is the capital of France?');
    await createQuizPage.mcqTitleArea.blur();

    await createQuizPage.mcqChoiceInputs.nth(0).fill('Paris');
    await createQuizPage.mcqChoiceInputs.nth(1).fill('London');
    await createQuizPage.mcqChoiceInputs.nth(0).blur();
    await createQuizPage.mcqChoiceInputs.nth(1).blur();

    await createQuizPage.mcqRadios.nth(0).click({ force: true });

    await createQuizPage.mcqMarksInput.fill('3');
    await createQuizPage.mcqMarksInput.blur();

    await createQuizPage.selectQuestionType('Essay');
    await createQuizPage.addQuestionBtn.click();

    await createQuizPage.essayTitleArea.fill(
      'Explain polymorphism in Object-Oriented Programming.',
    );
    await createQuizPage.essayTitleArea.blur();

    await createQuizPage.essayReferenceArea.fill(
      'Polymorphism is the ability of an object to take on many forms.',
    );
    await createQuizPage.essayReferenceArea.blur();

    await createQuizPage.essayMarksInput.fill('2');
    await createQuizPage.essayMarksInput.blur();

    await createQuizPage.selectQuestionType('True/False');
    await createQuizPage.addQuestionBtn.click();

    await createQuizPage.tfTitleArea.fill('C# is an object-oriented programming language.');
    await createQuizPage.tfTitleArea.blur();

    await createQuizPage.tfRadios.nth(0).click({ force: true });

    await createQuizPage.tfMarksInput.fill('1');
    await createQuizPage.tfMarksInput.blur();

    await expect(createQuizPage.publishBtn).toBeEnabled();

    const createQuizResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/quizzes') && response.request().method() === 'POST',
    );

    await createQuizPage.publishBtn.click();

    const confirmModal = new ConfirmActionModalPage(page);
    await confirmModal.confirm('publish', 'Yes, Publish Quiz');

    const createQuizResponse = await createQuizResponsePromise;
    expect([200, 201]).toContain(createQuizResponse.status());
  });

  test.describe('Unsaved work confirmation', () => {
    test('should navigate away without prompt when quiz is empty', async ({ page }) => {
      await clickSidebarTab(page, 'Dashboard');
      await expect(page).toHaveURL('/instructor/dashboard');
    });

    test('should show confirmation modal when navigating away with unsaved content and cancel keeps you', async ({
      page,
    }) => {
      await addQuizContent(createQuizPage);

      await clickSidebarTab(page, 'Dashboard');
      const confirmModal = new ConfirmActionModalPage(page);
      await expect(confirmModal.modal).toBeVisible();
      await expect(page.locator('.modal-dialog h3')).toHaveText('Leave Quiz Builder');

      await confirmModal.cancel();
      await expect(page).toHaveURL('/instructor/create-quiz');
    });

    test('should navigate away after confirming the modal with typed phrase', async ({ page }) => {
      await addQuizContent(createQuizPage);

      await clickSidebarTab(page, 'Dashboard');
      const confirmModal = new ConfirmActionModalPage(page);
      await confirmModal.confirm('leave', 'I understand, leave');
      await expect(page).toHaveURL('/instructor/dashboard');
    });
  });
});
