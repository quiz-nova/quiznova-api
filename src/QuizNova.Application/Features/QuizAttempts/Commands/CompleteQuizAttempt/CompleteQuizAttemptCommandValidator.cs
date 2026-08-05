using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Commands.CompleteQuizAttempt;

public sealed class CompleteQuizAttemptCommandValidator : AbstractValidator<CompleteQuizAttemptCommand>
{
    public static class ErrorMessages
    {
        public const string AttemptIdRequired = "Attempt ID is required.";
        public const string SubmittedAtRequired = "Submitted at time is required.";
    }

    public CompleteQuizAttemptCommandValidator()
    {
        RuleFor(command => command.AttemptId).NotEmpty().WithMessage(ErrorMessages.AttemptIdRequired);
        RuleFor(command => command.SubmittedAt).NotEqual(default(DateTimeOffset))
            .WithMessage(ErrorMessages.SubmittedAtRequired);
    }
}

