using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Students.Commands.CreateStudent;
using QuizNova.Application.Features.Students.Commands.UpdateStudent;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Students.Commands.UpdateStudent;

public class UpdateStudentCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new UpdateStudentCommand(
            Guid.Empty,
            new PersonalInformationDto("Valid Name", "student@example.com", "+123456789"));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateStudentCommand>(x => x.Id) &&
            e.Description == UpdateStudentCommandValidator.ErrorMessages.IdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var nonExistentId = Guid.NewGuid();
        var command = new UpdateStudentCommand(
            nonExistentId,
            new PersonalInformationDto("Valid Name", "student@example.com", "+123456789"));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.StudentNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldUpdateSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a valid Student first
        var uniqueEmail1 = $"student_{Guid.NewGuid()}@example.com";
        var uniquePhone1 = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createCommand = new CreateStudentCommand(
            new PersonalInformationDto("Original Name", uniqueEmail1, uniquePhone1),
            "SecurePass123!",
            nameof(UserRole.Student));
        var createResult = await mediator.Send(createCommand);
        createResult.IsSuccess.Should().BeTrue();

        var studentId = createResult.Value.Id;

        // 2. Prepare Update Command
        var uniqueEmail2 = $"student_{Guid.NewGuid()}@example.com";
        var uniquePhone2 = $"+1{Guid.NewGuid().ToString()[..10]}";
        var updateCommand = new UpdateStudentCommand(
            studentId,
            new PersonalInformationDto("Updated Student Name", uniqueEmail2, uniquePhone2));

        // Act
        var updateResult = await mediator.Send(updateCommand);

        // Assert
        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Value.PersonalInformation.Name.Should().Be("Updated Student Name");
        updateResult.Value.PersonalInformation.Email.Should().Be(uniqueEmail2);

        // Verify updated in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var studentInDb = await mongoContext.Users.Find(u => u.UserRole == UserRole.Student && u.Id == studentId).FirstOrDefaultAsync();

        studentInDb.Should().NotBeNull();
        studentInDb.PersonalInformation.Name.Should().Be("Updated Student Name");
        studentInDb.PersonalInformation.Email.Should().Be(uniqueEmail2);
        studentInDb.PersonalInformation.PhoneNumber.Should().Be(uniquePhone2);
    }

    [Fact]
    public async Task Handle_WithInvalidData_ShouldReturnValidationError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // Create Student
        var uniqueEmail = $"student_{Guid.NewGuid()}@example.com";
        var uniquePhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createCommand = new CreateStudentCommand(
            new PersonalInformationDto("Original Name", uniqueEmail, uniquePhone),
            "SecurePass123!",
            nameof(UserRole.Student));
        var createResult = await mediator.Send(createCommand);
        var studentId = createResult.Value.Id;

        // Update with name too short
        var updateCommand = new UpdateStudentCommand(
            studentId,
            new PersonalInformationDto("Ab", uniqueEmail, uniquePhone));

        // Act
        var result = await mediator.Send(updateCommand);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateStudentCommand>(x => x.PersonalInformation.Name) &&
            e.Description == UpdateStudentCommandValidator.ErrorMessages.NameMinLength);
    }

    [Fact]
    public async Task Handle_WithDuplicateEmailForAnotherUser_ShouldReturnDuplicateEmailError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create Student A
        var emailA = $"student_{Guid.NewGuid()}@example.com";
        var phoneA = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createA = new CreateStudentCommand(
            new PersonalInformationDto("Student A", emailA, phoneA),
            "SecurePass123!",
            nameof(UserRole.Student));
        var resA = await mediator.Send(createA);
        resA.IsSuccess.Should().BeTrue();

        // 2. Create Student B
        var emailB = $"student_{Guid.NewGuid()}@example.com";
        var phoneB = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createB = new CreateStudentCommand(
            new PersonalInformationDto("Student B", emailB, phoneB),
            "SecurePass123!",
            nameof(UserRole.Student));
        var resB = await mediator.Send(createB);
        var studentBId = resB.Value.Id;

        // 3. Try to update Student B's email to match Student A
        var updateCommand = new UpdateStudentCommand(
            studentBId,
            new PersonalInformationDto("Student B Updated", emailA, phoneB));

        // Act
        var result = await mediator.Send(updateCommand);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.UserEmailAlreadyExists(string.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithDuplicatePhoneNumberForAnotherUser_ShouldReturnDuplicatePhoneNumberError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create Student A
        var emailA = $"student_{Guid.NewGuid()}@example.com";
        var phoneA = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createA = new CreateStudentCommand(
            new PersonalInformationDto("Student A", emailA, phoneA),
            "SecurePass123!",
            nameof(UserRole.Student));
        var resA = await mediator.Send(createA);
        resA.IsSuccess.Should().BeTrue();

        // 2. Create Student B
        var emailB = $"student_{Guid.NewGuid()}@example.com";
        var phoneB = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createB = new CreateStudentCommand(
            new PersonalInformationDto("Student B", emailB, phoneB),
            "SecurePass123!",
            nameof(UserRole.Student));
        var resB = await mediator.Send(createB);
        var studentBId = resB.Value.Id;

        // 3. Try to update Student B's phone number to match Student A
        var updateCommand = new UpdateStudentCommand(
            studentBId,
            new PersonalInformationDto("Student B Updated", emailB, phoneA));

        // Act
        var result = await mediator.Send(updateCommand);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.UserPhoneNumberAlreadyExists(string.Empty).Code);
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
