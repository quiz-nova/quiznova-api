using FluentValidation;

namespace QuizNova.Application.Features.Students.Queries.GetStudentById;

public sealed class GetStudentByIdQueryValidator : AbstractValidator<GetStudentByIdQuery>
{
    public static class ErrorMessages
    {
        public const string IdRequired = "Student ID is required.";
    }

    public GetStudentByIdQueryValidator()
    {
        RuleFor(query => query.Id)
            .NotEmpty().WithMessage(ErrorMessages.IdRequired);
    }
}

