using FluentValidation;

namespace QuizNova.Application.Features.Admins.Queries.GetAdminById;

public sealed class GetAdminByIdQueryValidator : AbstractValidator<GetAdminByIdQuery>
{
    public static class ErrorMessages
    {
        public const string IdRequired = "Admin ID is required.";
    }

    public GetAdminByIdQueryValidator()
    {
        RuleFor(query => query.Id)
            .NotEmpty().WithMessage(ErrorMessages.IdRequired);
    }
}

