using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Commands.GradeQuestion;

public sealed class GradeQuestionCommandValidator : AbstractValidator<GradeQuestionCommand>
{
    public static class ErrorMessages
    {
        public const string AnswerIdRequired = "Answer ID is required.";
        public const string ScoreNonNegative = "Score must be greater than or equal to zero.";
        public const string FeedbackMinLength = "Feedback must be at least 3 characters long.";
        public const string FeedbackMaxLength = "Feedback must not exceed 200 characters.";
    }

    public GradeQuestionCommandValidator()
    {
        RuleFor(command => command.AnswerId)
            .NotEmpty()
            .WithMessage(ErrorMessages.AnswerIdRequired);

        RuleFor(command => command.Score)
            .GreaterThanOrEqualTo(0)
            .WithMessage(ErrorMessages.ScoreNonNegative);

        When(command => command.Feedback is not null, () =>
        {
            RuleFor(command => command.Feedback)
                .MinimumLength(3).WithMessage(ErrorMessages.FeedbackMinLength)
                .MaximumLength(200).WithMessage(ErrorMessages.FeedbackMaxLength);
        });
    }
}

