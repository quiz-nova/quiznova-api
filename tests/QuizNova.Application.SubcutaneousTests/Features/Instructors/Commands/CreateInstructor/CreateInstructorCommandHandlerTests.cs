using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Instructors.Commands.CreateInstructor;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Instructors.Commands.CreateInstructor;

public class CreateInstructorCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithValidData_ShouldSuccess()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var uniqueEmail = $"instructor_{Guid.NewGuid()}@example.com";
        var uniquePhone = $"+1{Guid.NewGuid().ToString()[..10]}"; // ensure valid length between 7 and 15

        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Valid Instructor Name", uniqueEmail, uniquePhone),
            "SecurePass123!",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should().BeTrue($"because creation should succeed but failed with: {result.TopError.Description}");
        result.Value.Should().NotBeNull();
        result.Value.PersonalInformation.Email.Should().Be(uniqueEmail);

        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var instructorInDb = await mongoContext.Users.Find(u => u.UserRole == UserRole.Instructor && u.PersonalInformation.Email == uniqueEmail).FirstOrDefaultAsync();

        instructorInDb.Should().NotBeNull();
        instructorInDb.PersonalInformation.Name.Should().Be("Valid Instructor Name");
        instructorInDb.PersonalInformation.PhoneNumber.Should().Be(uniquePhone);
        instructorInDb.UserRole.Should().Be(UserRole.Instructor);
    }

    [Fact]
    public async Task Handle_WithNameLessThanThreeChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Ab", "instructor@example.com", "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == $"{nameof(CreateInstructorCommand.PersonalInformation)}.{nameof(PersonalInformationDto.Name)}" &&
            e.Description == CreateInstructorCommandValidator.ErrorMessages.NameMinLength);
    }

    [Fact]
    public async Task Handle_WithEmptyEmail_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Valid Name", string.Empty, "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == $"{nameof(CreateInstructorCommand.PersonalInformation)}.{nameof(PersonalInformationDto.Email)}" &&
            e.Description == CreateInstructorCommandValidator.ErrorMessages.EmailRequired);
    }

    [Fact]
    public async Task Handle_WithInvalidEmailFormat_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Valid Name", "invalid-email", "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == $"{nameof(CreateInstructorCommand.PersonalInformation)}.{nameof(PersonalInformationDto.Email)}" &&
            e.Description == CreateInstructorCommandValidator.ErrorMessages.EmailInvalid);
    }

    [Fact]
    public async Task Handle_WithWeakPassword_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Valid Name", "instructor@example.com", "+123456789"),
            "weak",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateInstructorCommand>(x => x.Password) &&
            e.Description == CreateInstructorCommandValidator.ErrorMessages.PasswordMinLength);
    }

    [Fact]
    public async Task Handle_WithInvalidRoleForInstructor_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Valid Name", "instructor@example.com", "+123456789"),
            "SecurePass123!",
            nameof(UserRole.Admin));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateInstructorCommand>(x => x.Role) &&
            e.Description == CreateInstructorCommandValidator.ErrorMessages.RoleMustBeInstructor);
    }

    [Fact]
    public async Task Handle_WithPhoneNumberLessThanSevenChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Valid Name", "instructor@example.com", "12345"),
            "SecurePass123!",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == $"{nameof(CreateInstructorCommand.PersonalInformation)}.{nameof(PersonalInformationDto.PhoneNumber)}" &&
            e.Description == CreateInstructorCommandValidator.ErrorMessages.PhoneNumberLength);
    }

    [Fact]
    public async Task Handle_WithPhoneNumberGreaterThanFifteenChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateInstructorCommand(
            new PersonalInformationDto("Valid Name", "instructor@example.com", "1234567890123456"),
            "SecurePass123!",
            nameof(UserRole.Instructor));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == $"{nameof(CreateInstructorCommand.PersonalInformation)}.{nameof(PersonalInformationDto.PhoneNumber)}" &&
            e.Description == CreateInstructorCommandValidator.ErrorMessages.PhoneNumberLength);
    }

    [Fact]
    public async Task Handle_WithDuplicateEmail_ShouldReturnDuplicateEmailError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var email = $"instructor_{Guid.NewGuid()}@example.com";
        var phone1 = $"+1{Guid.NewGuid().ToString()[..10]}";
        var phone2 = $"+1{Guid.NewGuid().ToString()[..10]}";

        var command1 = new CreateInstructorCommand(new PersonalInformationDto("Instructor One", email, phone1), "SecurePass123!", nameof(UserRole.Instructor));
        var command2 = new CreateInstructorCommand(new PersonalInformationDto("Instructor Two", email, phone2), "SecurePass123!", nameof(UserRole.Instructor));

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
        var email1 = $"instructor_{Guid.NewGuid()}@example.com";
        var email2 = $"instructor_{Guid.NewGuid()}@example.com";
        var phone = $"+1{Guid.NewGuid().ToString()[..10]}";

        var command1 = new CreateInstructorCommand(new PersonalInformationDto("Instructor One", email1, phone), "SecurePass123!", nameof(UserRole.Instructor));
        var command2 = new CreateInstructorCommand(new PersonalInformationDto("Instructor Two", email2, phone), "SecurePass123!", nameof(UserRole.Instructor));

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
