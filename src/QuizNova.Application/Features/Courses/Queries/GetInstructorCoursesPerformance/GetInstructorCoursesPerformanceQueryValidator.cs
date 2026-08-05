using FluentValidation;

namespace QuizNova.Application.Features.Courses.Queries.GetInstructorCoursesPerformance;

public sealed class GetInstructorCoursesPerformanceQueryValidator : AbstractValidator<GetInstructorCoursesPerformanceQuery>
{
    public static class ErrorMessages
    {
        public const string InstructorIdRequired = "Instructor ID is required.";
    }

    public GetInstructorCoursesPerformanceQueryValidator()
    {
        RuleFor(query => query.InstructorId)
            .NotEmpty().WithMessage(ErrorMessages.InstructorIdRequired);
    }
}

