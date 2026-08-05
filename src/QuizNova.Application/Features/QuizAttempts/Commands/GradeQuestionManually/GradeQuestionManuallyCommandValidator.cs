using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Commands.GradeQuestionManually;

public sealed class GradeQuestionManuallyCommandValidator : AbstractValidator<GradeQuestionManuallyCommand>
{
    public static class ErrorMessages
    {
        public const string AnswerIdRequired = "Answer ID is required.";
        public const string ScoreNonNegative = "Score must be greater than or equal to zero.";
    }

    public GradeQuestionManuallyCommandValidator()
    {
        RuleFor(command => command.AnswerId)
            .NotEmpty()
            .WithMessage(ErrorMessages.AnswerIdRequired);

        RuleFor(command => command.Score)
            .GreaterThanOrEqualTo(0)
            .WithMessage(ErrorMessages.ScoreNonNegative);
    }
}

