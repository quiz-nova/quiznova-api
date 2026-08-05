using FluentValidation;

namespace QuizNova.Application.Features.Courses.Queries.GetInstructorCoursesCount;

public sealed class GetInstructorCoursesCountQueryValidator : AbstractValidator<GetInstructorCoursesCountQuery>
{
    public static class ErrorMessages
    {
        public const string InstructorIdRequired = "Instructor ID is required.";
    }

    public GetInstructorCoursesCountQueryValidator()
    {
        RuleFor(query => query.InstructorId)
            .NotEmpty().WithMessage(ErrorMessages.InstructorIdRequired);
    }
}


