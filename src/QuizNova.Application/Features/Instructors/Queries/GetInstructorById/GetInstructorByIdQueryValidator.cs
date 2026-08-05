using FluentValidation;

namespace QuizNova.Application.Features.Instructors.Queries.GetInstructorById;

public sealed class GetInstructorByIdQueryValidator : AbstractValidator<GetInstructorByIdQuery>
{
    public static class ErrorMessages
    {
        public const string IdRequired = "Instructor ID is required.";
    }

    public GetInstructorByIdQueryValidator()
    {
        RuleFor(query => query.Id)
            .NotEmpty().WithMessage(ErrorMessages.IdRequired);
    }
}

