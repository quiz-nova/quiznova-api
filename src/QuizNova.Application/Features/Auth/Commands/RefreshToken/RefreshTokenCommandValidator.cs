using FluentValidation;

namespace QuizNova.Application.Features.Auth.Commands.RefreshToken;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public static class ErrorMessages
    {
        public const string RefreshTokenRequired = "Refresh token is required.";
        public const string ExpiredAccessTokenRequired = "Expired access token is required.";
    }

    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage(ErrorMessages.RefreshTokenRequired);

        RuleFor(x => x.ExpiredAccessToken)
            .NotEmpty().WithMessage(ErrorMessages.ExpiredAccessTokenRequired);
    }
}

