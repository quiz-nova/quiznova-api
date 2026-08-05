using FluentValidation;

namespace QuizNova.Application.Features.Quizzes.Queries.GetStudentQuizzes;

public sealed class GetStudentQuizzesQueryValidator : AbstractValidator<GetStudentQuizzesQuery>
{
    public static class ErrorMessages
    {
        public const string StudentIdRequired = "Student ID is required.";
    }

    public GetStudentQuizzesQueryValidator()
    {
        RuleFor(query => query.StudentId)
            .NotEmpty().WithMessage(ErrorMessages.StudentIdRequired);
    }
}

