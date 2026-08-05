using FluentValidation;

namespace QuizNova.Application.Features.Quizzes.Queries.GetInstructorQuizzes;

public sealed class GetInstructorQuizzesQueryValidator : AbstractValidator<GetInstructorQuizzesQuery>
{
    public static class ErrorMessages
    {
        public const string InstructorIdRequired = "Instructor ID is required.";
    }

    public GetInstructorQuizzesQueryValidator()
    {
        RuleFor(query => query.InstructorId)
            .NotEmpty().WithMessage(ErrorMessages.InstructorIdRequired);
    }
}

