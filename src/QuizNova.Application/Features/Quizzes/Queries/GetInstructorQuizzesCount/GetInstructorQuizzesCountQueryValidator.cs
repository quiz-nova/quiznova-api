using FluentValidation;

namespace QuizNova.Application.Features.Quizzes.Queries.GetInstructorQuizzesCount;

public sealed class GetInstructorQuizzesCountQueryValidator : AbstractValidator<GetInstructorQuizzesCountQuery>
{
    public static class ErrorMessages
    {
        public const string InstructorIdRequired = "Instructor ID is required.";
    }

    public GetInstructorQuizzesCountQueryValidator()
    {
        RuleFor(query => query.InstructorId)
            .NotEmpty().WithMessage(ErrorMessages.InstructorIdRequired);
    }
}
