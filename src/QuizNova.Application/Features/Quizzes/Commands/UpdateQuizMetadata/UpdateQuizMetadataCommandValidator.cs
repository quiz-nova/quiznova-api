using FluentValidation;

namespace QuizNova.Application.Features.Quizzes.Commands.UpdateQuizMetadata;

public sealed class UpdateQuizMetadataCommandValidator : AbstractValidator<UpdateQuizMetadataCommand>
{
    public static class ErrorMessages
    {
        public const string QuizIdRequired = "Quiz ID is required.";
        public const string TitleRequired = "Title is required.";
        public const string TitleMin = "Title must not less than 3 characters.";
        public const string TitleMax = "Title must not exceed 30 characters.";
        public const string StartsAtRequired = "Start time is required.";
        public const string EndsAtRequired = "End time is required.";
        public const string EndsAtAfterStart = "End time must be after start time.";
    }

    public UpdateQuizMetadataCommandValidator()
    {
        RuleFor(x => x.QuizId)
            .NotEmpty().WithMessage(ErrorMessages.QuizIdRequired);

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ErrorMessages.TitleRequired)
            .MinimumLength(3).WithMessage(ErrorMessages.TitleMin)
            .MaximumLength(30).WithMessage(ErrorMessages.TitleMax);

        RuleFor(x => x.StartsAtUtc)
            .NotEmpty().WithMessage(ErrorMessages.StartsAtRequired);

        RuleFor(x => x.EndsAtUtc)
            .NotEmpty().WithMessage(ErrorMessages.EndsAtRequired)
            .GreaterThan(x => x.StartsAtUtc).WithMessage(ErrorMessages.EndsAtAfterStart);
    }
}

