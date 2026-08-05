using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Auth.Commands.Login;
using QuizNova.Application.Features.Auth.Commands.RefreshToken;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;

namespace QuizNova.Application.SubcutaneousTests.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithBothFieldsEmpty_ShouldReturnValidationErrors()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new RefreshTokenCommand(string.Empty, string.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<RefreshTokenCommand>(x => x.RefreshToken) &&
            e.Description == RefreshTokenCommandValidator.ErrorMessages.RefreshTokenRequired);
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<RefreshTokenCommand>(x => x.ExpiredAccessToken) &&
            e.Description == RefreshTokenCommandValidator.ErrorMessages.ExpiredAccessTokenRequired);
    }

    [Fact]
    public async Task Handle_WithValidTokensAfterExpiry_ShouldReturnNewTokenAndRevokeOldRefreshToken()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var fakeTime = factory.GetFakeTimeProvider();

        // Login to get initial tokens
        var loginResult = await mediator.Send(
            new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "Instructor"));
        loginResult.IsSuccess.Should().BeTrue();

        var originalAccessToken = loginResult.Value.Token.AccessToken;
        var originalRefreshToken = loginResult.Value.Token.RefreshToken;

        // Advance time by 8 minutes so the access token is expired (7-minute expiry)
        fakeTime.Advance(TimeSpan.FromMinutes(8));

        // Act
        var refreshResult = await mediator.Send(
            new RefreshTokenCommand(originalRefreshToken, originalAccessToken));

        // Assert
        refreshResult.IsSuccess.Should().BeTrue();
        refreshResult.Value.AccessToken.Should().NotBeNullOrWhiteSpace();
        refreshResult.Value.RefreshToken.Should().NotBeNullOrWhiteSpace();
        refreshResult.Value.RefreshToken.Should().NotBe(originalRefreshToken);

        // Verify DB state: old refresh token is revoked, new one is active
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();

        var oldToken = await mongoContext.UserRefreshTokens.Find(rt => rt.Token == originalRefreshToken).FirstOrDefaultAsync();
        oldToken.Should().NotBeNull();
        oldToken.RevokedOnUtc.Should().NotBeNull("because the old token should be revoked");

        var newToken = await mongoContext.UserRefreshTokens.Find(rt => rt.Token == refreshResult.Value.RefreshToken).FirstOrDefaultAsync();
        newToken.Should().NotBeNull();
        newToken.RevokedOnUtc.Should().BeNull("because the new token should still be active");
    }

    [Fact]
    public async Task Handle_WithExpiredRefreshToken_ShouldReturnExpiredOrRevokedError()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // Login to get a valid access token
        var loginResult = await mediator.Send(
            new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "Instructor"));
        loginResult.IsSuccess.Should().BeTrue();

        var accessToken = loginResult.Value.Token.AccessToken;

        // Insert an expired refresh token directly into the DB
        var expiredRefreshToken = Guid.NewGuid().ToString();
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var userToken = await mongoContext.UserRefreshTokens
                .Find(rt => rt.Token == loginResult.Value.Token.RefreshToken)
                .FirstAsync();

            await mongoContext.UserRefreshTokens.InsertOneAsync(new UserRefreshToken
            {
                Id = Guid.NewGuid(),
                Token = expiredRefreshToken,
                UserId = userToken.UserId,
                ExpiresOnUtc = DateTimeOffset.UtcNow.AddDays(-1), // already expired
            });
        }

        // Act
        var result = await mediator.Send(new RefreshTokenCommand(expiredRefreshToken, accessToken));

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.ExpiredOrRevokedRefreshToken.Code);
    }

    [Fact]
    public async Task Handle_WithNonExistentRefreshToken_ShouldReturnInvalidRefreshTokenError()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // Login to get a valid access token
        var loginResult = await mediator.Send(
            new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "Instructor"));
        loginResult.IsSuccess.Should().BeTrue();

        // Act
        var result = await mediator.Send(
            new RefreshTokenCommand("non-existent-refresh-token", loginResult.Value.Token.AccessToken));

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InvalidRefreshToken.Code);
    }

    [Fact]
    public async Task Handle_WithInvalidAccessToken_ShouldReturnExpiredAccessTokenInvalidError()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // Login to get a valid refresh token
        var loginResult = await mediator.Send(
            new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "Instructor"));
        loginResult.IsSuccess.Should().BeTrue();

        // Act
        var result = await mediator.Send(
            new RefreshTokenCommand(loginResult.Value.Token.RefreshToken, "garbage-invalid-token"));

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.ExpiredAccessTokenInvalid.Code);
    }

    [Fact]
    public async Task Handle_WithRevokedRefreshToken_ShouldReturnExpiredOrRevokedError()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // Login to get tokens
        var loginResult = await mediator.Send(
            new LoginCommand("ahmed.nasser@quiznova.local", "Instructor123!", "Instructor"));
        loginResult.IsSuccess.Should().BeTrue();

        var accessToken = loginResult.Value.Token.AccessToken;
        var refreshToken = loginResult.Value.Token.RefreshToken;

        // Manually revoke the refresh token in the DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var storedToken = await mongoContext.UserRefreshTokens.Find(rt => rt.Token == refreshToken).FirstAsync();
            storedToken.RevokedOnUtc = DateTimeOffset.UtcNow;
            await mongoContext.UserRefreshTokens.ReplaceOneAsync(rt => rt.Id == storedToken.Id, storedToken);
        }

        // Act
        var actMediator = factory.CreateMediator();
        var result = await actMediator.Send(new RefreshTokenCommand(refreshToken, accessToken));

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.ExpiredOrRevokedRefreshToken.Code);
    }
}
