using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Admins.Commands.CreateAdmin;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Admins.Commands.CreateAdmin;

public class CreateAdminCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithValidData_ShouldCreateAdminSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var uniqueEmail = $"admin_{Guid.NewGuid()}@example.com";
        var uniquePhone = $"+1{Guid.NewGuid().ToString()[..10]}"; // ensure valid length between 7 and 15

        var command = new CreateAdminCommand(
            new PersonalInformationDto("Valid Admin Name", uniqueEmail, uniquePhone),
            "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should()
            .BeTrue($"because creation should succeed but failed with: {result.TopError.Description}");
        result.Value.Should().NotBeNull();
        result.Value.PersonalInformation.Email.Should().Be(uniqueEmail);

        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var adminInDb = await mongoContext.Users
            .Find(u => u.UserRole == UserRole.Admin && u.PersonalInformation.Email == uniqueEmail)
            .FirstOrDefaultAsync();

        adminInDb.Should().NotBeNull();
        adminInDb.PersonalInformation.Name.Should().Be("Valid Admin Name");
        adminInDb.PersonalInformation.PhoneNumber.Should().Be(uniquePhone);
        adminInDb.UserRole.Should().Be(UserRole.Admin);
    }

    [Fact]
    public async Task Handle_WithNameLessThanThreeChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateAdminCommand(
            new PersonalInformationDto("Ab", "admin@example.com", "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateAdminCommand>(x => x.PersonalInformation.Name) &&
            e.Description == CreateAdminCommandValidator.ErrorMessages.NameMinLength);
    }

    [Fact]
    public async Task Handle_WithEmptyEmail_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateAdminCommand(
            new PersonalInformationDto("Valid Name", string.Empty, "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateAdminCommand>(x => x.PersonalInformation.Email) &&
            e.Description == CreateAdminCommandValidator.ErrorMessages.EmailRequired);
    }

    [Fact]
    public async Task Handle_WithInvalidEmailFormat_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateAdminCommand(
            new PersonalInformationDto("Valid Name", "invalid-email", "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateAdminCommand>(x => x.PersonalInformation.Email) &&
            e.Description == CreateAdminCommandValidator.ErrorMessages.EmailInvalid);
    }

    [Fact]
    public async Task Handle_WithWeakPassword_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateAdminCommand(
            new PersonalInformationDto("Valid Name", "admin@example.com", "+123456789"),
            "weak",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateAdminCommand>(x => x.Password));
    }

    [Fact]
    public async Task Handle_WithInvalidRoleForAdmin_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateAdminCommand(
            new PersonalInformationDto("Valid Name", "admin@example.com", "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateAdminCommand>(x => x.Role) &&
            e.Description == CreateAdminCommandValidator.ErrorMessages.RoleInvalid);
    }

    [Fact]
    public async Task Handle_WithPhoneNumberLessThanSevenChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateAdminCommand(
            new PersonalInformationDto("Valid Name", "admin@example.com", "12345"),
            "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateAdminCommand>(x => x.PersonalInformation.PhoneNumber) &&
            e.Description == CreateAdminCommandValidator.ErrorMessages.PhoneNumberLength);
    }

    [Fact]
    public async Task Handle_WithPhoneNumberGreaterThanFifteenChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateAdminCommand(
            new PersonalInformationDto("Valid Name", "admin@example.com", "1234567890123456"),
            "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateAdminCommand>(x => x.PersonalInformation.PhoneNumber) &&
            e.Description == CreateAdminCommandValidator.ErrorMessages.PhoneNumberLength);
    }

    [Fact]
    public async Task Handle_WithDuplicateEmail_ShouldReturnDuplicateEmailError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var email = $"admin_{Guid.NewGuid()}@example.com";
        var phone1 = $"+1{Guid.NewGuid().ToString()[..10]}";
        var phone2 = $"+1{Guid.NewGuid().ToString()[..10]}";

        var command1 = new CreateAdminCommand(new PersonalInformationDto("Admin One", email, phone1), "SecurePass123!",
            nameof(UserRole.Admin));
        var command2 = new CreateAdminCommand(new PersonalInformationDto("Admin Two", email, phone2), "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result1 = await mediator.Send(command1);
        var result2 = await mediator.Send(command2);

        // Assert
        result1.IsSuccess.Should().BeTrue();
        result2.IsError.Should().BeTrue();
        result2.TopError.Code.Should().Be(ApplicationErrors.UserEmailAlreadyExists(string.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithDuplicatePhoneNumber_ShouldReturnDuplicatePhoneNumberError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var email1 = $"admin_{Guid.NewGuid()}@example.com";
        var email2 = $"admin_{Guid.NewGuid()}@example.com";
        var phone = $"+1{Guid.NewGuid().ToString()[..10]}";

        var command1 = new CreateAdminCommand(new PersonalInformationDto("Admin One", email1, phone), "SecurePass123!",
            nameof(UserRole.Admin));
        var command2 = new CreateAdminCommand(new PersonalInformationDto("Admin Two", email2, phone), "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result1 = await mediator.Send(command1);
        var result2 = await mediator.Send(command2);

        // Assert
        result1.IsSuccess.Should().BeTrue();
        result2.IsError.Should().BeTrue();
        result2.TopError.Code.Should().Be(ApplicationErrors.UserPhoneNumberAlreadyExists(string.Empty).Code);
    }

    private void EnsureAdminContext()
    {
        var adminId = Guid.Parse(TestUsers.Admin.User.Id);
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        if (!mongoContext.Users.Find(u => u.UserRole == UserRole.Admin && u.Id == adminId).Any())
        {
            var personalInfo = PersonalInformation.Create("Admin User", "admin@quiznova.local", "01000000000").Value;
            var admin = Admin.Create(adminId, personalInfo).Value;
            mongoContext.Users.InsertOne(admin);
        }

        TestCurrentUser.Set(TestUsers.Admin.User);
    }
}
