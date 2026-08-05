using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Commands.StartQuizAttempt;

public sealed class StartQuizAttemptCommandValidator : AbstractValidator<StartQuizAttemptCommand>
{
    public static class ErrorMessages
    {
        public const string QuizIdRequired = "Quiz ID is required.";
    }

    public StartQuizAttemptCommandValidator()
    {
        RuleFor(command => command.QuizId).NotEmpty().WithMessage(ErrorMessages.QuizIdRequired);
    }
}

