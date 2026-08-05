using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Commands.SubmitQuestionAnswer;

public sealed class SubmitQuestionAnswerCommandValidator : AbstractValidator<SubmitQuestionAnswerCommand>
{
    public static class ErrorMessages
    {
        public const string AttemptIdRequired = "Attempt ID is required.";
        public const string AnswerRequired = "Answer is required.";
        public const string QuestionIdRequired = "Question ID is required.";
    }

    public SubmitQuestionAnswerCommandValidator()
    {
        RuleFor(command => command.AttemptId).NotEmpty().WithMessage(ErrorMessages.AttemptIdRequired);

        RuleFor(command => command.Answer).NotNull().WithMessage(ErrorMessages.AnswerRequired);

        RuleFor(command => command.Answer.QuestionId).NotEmpty().WithMessage(ErrorMessages.QuestionIdRequired);

        RuleFor(command => command.Answer)
            .SetInheritanceValidator(v =>
            {
                v.Add(new SubmitEssayAnswerCommandValidator());
                v.Add(new SubmitMcqAnswerCommandValidator());
            });
    }
}

public sealed class SubmitEssayAnswerCommandValidator : AbstractValidator<SubmitEssayAnswerCommand>
{
    public static class ErrorMessages
    {
        public const string StudentResponseRequired = "The student response is required.";
        public const string StudentResponseMin = "The student response must be at least 3 characters long.";
        public const string StudentResponseMax = "The student response must not exceed 1000 characters.";
    }

    public SubmitEssayAnswerCommandValidator()
    {
        RuleFor(command => command.StudentResponse)
            .NotEmpty().WithMessage(ErrorMessages.StudentResponseRequired)
            .MinimumLength(3).WithMessage(ErrorMessages.StudentResponseMin)
            .MaximumLength(1000).WithMessage(ErrorMessages.StudentResponseMax);
    }
}

public sealed class SubmitMcqAnswerCommandValidator : AbstractValidator<SubmitMcqAnswerCommand>
{
    public static class ErrorMessages
    {
        public const string SelectedChoiceIdRequired = "Selected choice ID is required.";
    }

    public SubmitMcqAnswerCommandValidator()
    {
        RuleFor(command => command.SelectedChoiceId)
            .NotEmpty().WithMessage(ErrorMessages.SelectedChoiceIdRequired);
    }
}

