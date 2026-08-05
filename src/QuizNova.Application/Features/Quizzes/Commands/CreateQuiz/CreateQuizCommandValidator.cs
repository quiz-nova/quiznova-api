using FluentValidation;

namespace QuizNova.Application.Features.Quizzes.Commands.CreateQuiz;

public sealed class CreateQuizCommandValidator : AbstractValidator<CreateQuizCommand>
{
    public static class ErrorMessages
    {
        public const string TitleRequired = "Title is required.";
        public const string TitleMin = "Title must not less than 3 characters.";
        public const string TitleMax = "Title must not exceed 30 characters.";
        public const string CourseIdRequired = "Course ID is required.";
        public const string StartsAtRequired = "Start time is required.";
        public const string StartsAtPast = "Start time must not be in the past.";
        public const string EndsAtRequired = "End time is required.";
        public const string EndsAtAfterStart = "End time must be after start time.";
        public const string QuizTimeApart = "Quiz start and end time must be at least 10 minutes apart.";
        public const string QuestionsRequired = "At least one question is required.";
    }

    public CreateQuizCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ErrorMessages.TitleRequired)
            .MinimumLength(3).WithMessage(ErrorMessages.TitleMin)
            .MaximumLength(30).WithMessage(ErrorMessages.TitleMax);

        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage(ErrorMessages.CourseIdRequired);

        RuleFor(x => x.StartsAtUtc)
            .NotEmpty().WithMessage(ErrorMessages.StartsAtRequired)
            .GreaterThanOrEqualTo(_ => DateTimeOffset.UtcNow.AddMinutes(-5))
            .WithMessage(ErrorMessages.StartsAtPast);

        RuleFor(x => x.EndsAtUtc)
            .NotEmpty().WithMessage(ErrorMessages.EndsAtRequired)
            .GreaterThan(x => x.StartsAtUtc).WithMessage(ErrorMessages.EndsAtAfterStart)
            .Must((cmd, endsAt) => endsAt >= cmd.StartsAtUtc.AddMinutes(10))
            .WithMessage(ErrorMessages.QuizTimeApart);

        RuleFor(x => x.Questions)
            .NotEmpty().WithMessage(ErrorMessages.QuestionsRequired);

        RuleForEach(x => x.Questions).Custom((question, ctx) =>
        {
            var validationResult = question switch
            {
                CreateMcqCommand mcq => new CreateMcqCommandValidator().Validate(mcq),
                CreateTfCommand tf => new CreateTfCommandValidator().Validate(tf),
                CreateEssayCommand essay => new CreateEssayCommandValidator().Validate(essay),
                _ => null,
            };

            if (validationResult is null)
            {
                return;
            }

            foreach (var failure in validationResult.Errors)
            {
                ctx.AddFailure(failure);
            }
        });
    }
}

public sealed class CreateQuestionCommandValidator : AbstractValidator<CreateQuestionCommand>
{
    public static class ErrorMessages
    {
        public const string QuestionTextRequired = "Question text is required.";
        public const string QuestionTextMin = "Question text must be at least 3 characters long.";
        public const string QuestionTextMax = "Question text must not exceed 1000 characters.";
        public const string MarksRange = "Marks must be between 1 and 5.";
    }

    public CreateQuestionCommandValidator()
    {
        RuleFor(x => x.QuestionText)
            .NotEmpty().WithMessage(ErrorMessages.QuestionTextRequired)
            .MinimumLength(3).WithMessage(ErrorMessages.QuestionTextMin)
            .MaximumLength(1000).WithMessage(ErrorMessages.QuestionTextMax);

        RuleFor(x => x.Marks)
            .InclusiveBetween(1, 5).WithMessage(ErrorMessages.MarksRange);
    }
}

public sealed class CreateMcqCommandValidator : AbstractValidator<CreateMcqCommand>
{
    public static class ErrorMessages
    {
        public const string ChoicesRequired = "Choices are required for MCQ.";
        public const string ChoicesMin = "MCQ must have at least 2 choices.";
        public const string CorrectChoiceIdRequired = "Correct choice ID is required for MCQ.";
        public const string CorrectChoiceIdMatch = "Correct choice ID must match one of the choices.";
    }

    public CreateMcqCommandValidator()
    {
        Include(new CreateQuestionCommandValidator());

        RuleFor(x => x.Choices)
            .NotEmpty().WithMessage(ErrorMessages.ChoicesRequired)
            .Must(x => x.Count >= 2).WithMessage(ErrorMessages.ChoicesMin);

        RuleForEach(x => x.Choices)
            .SetValidator(new CreateChoiceCommandValidator());

        RuleFor(x => x.CorrectChoiceId)
            .NotEmpty().WithMessage(ErrorMessages.CorrectChoiceIdRequired)
            .Must((cmd, id) => cmd.Choices.Any(c => c.Id == id))
            .WithMessage(ErrorMessages.CorrectChoiceIdMatch);
    }
}

public sealed class CreateTfCommandValidator : AbstractValidator<CreateTfCommand>
{
    public CreateTfCommandValidator()
    {
        Include(new CreateQuestionCommandValidator());
    }
}

public sealed class CreateEssayCommandValidator : AbstractValidator<CreateEssayCommand>
{
    public static class ErrorMessages
    {
        public const string AnswerReferenceMin = "Answer reference must be at least 3 characters long.";
        public const string AnswerReferenceMax = "Answer reference must not exceed 1000 characters.";
    }

    public CreateEssayCommandValidator()
    {
        Include(new CreateQuestionCommandValidator());

        RuleFor(x => x.AnswerReference)
            .MinimumLength(3).WithMessage(ErrorMessages.AnswerReferenceMin)
            .MaximumLength(1000).WithMessage(ErrorMessages.AnswerReferenceMax)
            .When(x => !string.IsNullOrWhiteSpace(x.AnswerReference));
    }
}

public sealed class CreateChoiceCommandValidator : AbstractValidator<CreateChoiceCommand>
{
    public static class ErrorMessages
    {
        public const string IdRequired = "Choice ID is required.";
        public const string TextRequired = "Choice text is required.";
        public const string TextMin = "Choice text must be at least 3 characters long.";
        public const string TextMax = "Choice text must not exceed 100 characters.";
    }

    public CreateChoiceCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ErrorMessages.IdRequired);

        RuleFor(x => x.Text)
            .NotEmpty().WithMessage(ErrorMessages.TextRequired)
            .MinimumLength(3).WithMessage(ErrorMessages.TextMin)
            .MaximumLength(100).WithMessage(ErrorMessages.TextMax);
    }
}

