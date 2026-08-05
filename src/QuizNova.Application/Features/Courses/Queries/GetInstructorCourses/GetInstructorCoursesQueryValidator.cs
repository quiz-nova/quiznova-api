using FluentValidation;

namespace QuizNova.Application.Features.Courses.Queries.GetInstructorCourses;

public sealed class GetInstructorCoursesQueryValidator : AbstractValidator<GetInstructorCoursesQuery>
{
    public static class ErrorMessages
    {
        public const string InstructorIdRequired = "Instructor ID is required.";
    }

    public GetInstructorCoursesQueryValidator()
    {
        RuleFor(query => query.InstructorId)
            .NotEmpty().WithMessage(ErrorMessages.InstructorIdRequired);
    }
}

