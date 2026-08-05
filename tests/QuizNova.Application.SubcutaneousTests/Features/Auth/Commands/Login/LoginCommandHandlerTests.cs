using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Auth.Commands.Login;
using QuizNova.Application.SubcutaneousTests.Common;

namespace QuizNova.Application.SubcutaneousTests.Features.Auth.Commands.Login;

public class LoginCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // --- Validation layer tests ---
    [Fact]
    public async Task Handle_WithAllEmptyFields_ShouldReturnValidationErrors()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand(string.Empty, string.Empty, string.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Email) &&
            e.Description == LoginCommandValidator.ErrorMessages.EmailRequired);
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Password) &&
            e.Description == LoginCommandValidator.ErrorMessages.PasswordRequired);
    }

    [Fact]
    public async Task Handle_WithInvalidEmailFormat_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("not-an-email", "ValidPass1!", string.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Email) &&
            e.Description == LoginCommandValidator.ErrorMessages.EmailInvalid);
    }

    [Fact]
    public async Task Handle_WithEmptyPassword_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("valid@email.com", string.Empty, string.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Password) &&
            e.Description == LoginCommandValidator.ErrorMessages.PasswordRequired);
    }

    [Fact]
    public async Task Handle_WithPasswordLessThan8Characters_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("valid@email.com", "Ab1!", "Instructor");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Password) &&
            e.Description == LoginCommandValidator.ErrorMessages.PasswordMinLength);
    }

    [Fact]
    public async Task Handle_WithPasswordWithoutUppercase_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("valid@email.com", "abcdefg1!", "Instructor");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Password) &&
            e.Description == LoginCommandValidator.ErrorMessages.PasswordUpper);
    }

    [Fact]
    public async Task Handle_WithPasswordWithoutLowercase_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("valid@email.com", "ABCDEFG1!", "Instructor");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Password) &&
            e.Description == LoginCommandValidator.ErrorMessages.PasswordLower);
    }

    [Fact]
    public async Task Handle_WithPasswordWithoutDigit_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("valid@email.com", "Abcdefgh!", "Instructor");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Password) &&
            e.Description == LoginCommandValidator.ErrorMessages.PasswordDigit);
    }

    [Fact]
    public async Task Handle_WithPasswordWithoutSpecialCharacter_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("valid@email.com", "Abcdefg1", "Instructor");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<LoginCommand>(x => x.Password) &&
            e.Description == LoginCommandValidator.ErrorMessages.PasswordSpecial);
    }

    // --- Handler layer tests ---
    [Fact]
    public async Task Handle_WithInvalidRole_ShouldReturnError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "guard");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InvalidRoleForLogin.Code);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_ShouldReturnAuthDtoAndStoreRefreshToken()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "Instructor");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Token.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.Value.Token.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.Value.User.Role.Should().Be("Instructor");

        // Verify DB state: refresh token exists and is active
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var storedToken = await mongoContext.UserRefreshTokens
            .Find(rt => rt.Token == result.Value.Token.RefreshToken)
            .FirstOrDefaultAsync();
        storedToken.Should().NotBeNull();
        storedToken.RevokedOnUtc.Should().BeNull("because the token should still be active");
    }

    [Fact]
    public async Task Handle_WithCorrectEmailButWrongPassword_ShouldReturnErrorAndNotCreateRefreshToken()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // Count existing refresh tokens before the attempt
        int tokenCountBefore;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            tokenCountBefore = (int)await mongoContext.UserRefreshTokens.CountDocumentsAsync(_ => true);
        }

        var command = new LoginCommand("ahmed.nasser@quiznova.local", "WrongPass123!", "Instructor");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be("Auth.InvalidCredentials");

        // Verify DB state: no new refresh tokens were created
        using var scopeAfter = factory.Services.CreateScope();
        var dbContextAfter = scopeAfter.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var tokenCountAfter = (int)await dbContextAfter.UserRefreshTokens.CountDocumentsAsync(_ => true);
        tokenCountAfter.Should().Be(tokenCountBefore);
    }

    [Fact]
    public async Task Handle_WithCorrectCredentialsButWrongRole_ShouldReturnInvalidRoleError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "Student");

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InvalidRoleForLogin.Code);
    }
}
